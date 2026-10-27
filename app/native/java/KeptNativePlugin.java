package com.desertcircuitapps.kept;

import static androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK;
import static androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Small native helpers for Kept (called from native.js):
 * share a backup/export file, print the tax report, fingerprint/face/screen-lock prompt, Google sign-in,
 * and Google Play Billing for Kept Pro.
 */
@CapacitorPlugin(name = "KeptNative")
public class KeptNativePlugin extends Plugin {

    /** Writes the text to a temporary file and opens Android's share sheet (Drive, Files, Gmail...). */
    @PluginMethod
    public void shareFile(PluginCall call) {
        String name = call.getString("name", "kept.txt").replaceAll("[^A-Za-z0-9._-]", "_");
        String type = call.getString("type", "text/plain");
        String text = call.getString("text", "");
        try {
            File dir = new File(getContext().getCacheDir(), "share");
            if (!dir.exists() && !dir.mkdirs()) throw new Exception("Couldn't create the file");
            File file = new File(dir, name);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(text.getBytes(StandardCharsets.UTF_8));
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(type);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, name);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, name);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "Couldn't share the file" : e.getMessage(), "error");
        }
    }

    /** Prints the page (the tax report's print styles apply), including "Save as PDF". */
    @PluginMethod
    public void printPage(PluginCall call) {
        String title = call.getString("title", "Kept");
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                pm.print(title, webView.createPrintDocumentAdapter(title), new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Couldn't print" : e.getMessage(), "error");
            }
        });
    }

    /** True when the phone has a fingerprint, face or screen lock set up. */
    @PluginMethod
    public void biometricAvailable(PluginCall call) {
        int result = BiometricManager.from(getContext()).canAuthenticate(BIOMETRIC_WEAK | DEVICE_CREDENTIAL);
        JSObject out = new JSObject();
        out.put("available", result == BiometricManager.BIOMETRIC_SUCCESS);
        call.resolve(out);
    }

    /** Shows Android's fingerprint / face / screen-lock prompt. Kept never sees the fingerprint or face. */
    @PluginMethod
    public void biometric(PluginCall call) {
        String title = call.getString("title", "Kept");
        String reason = call.getString("reason", "");
        getActivity().runOnUiThread(() -> {
            try {
                BiometricPrompt.PromptInfo.Builder info = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setAllowedAuthenticators(BIOMETRIC_WEAK | DEVICE_CREDENTIAL);
                if (reason != null && !reason.isEmpty()) info.setSubtitle(reason);
                BiometricPrompt prompt = new BiometricPrompt((FragmentActivity) getActivity(),
                        ContextCompat.getMainExecutor(getContext()),
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                call.resolve();
                            }

                            @Override
                            public void onAuthenticationError(int code, @NonNull CharSequence msg) {
                                boolean cancelled = code == BiometricPrompt.ERROR_USER_CANCELED
                                        || code == BiometricPrompt.ERROR_NEGATIVE_BUTTON
                                        || code == BiometricPrompt.ERROR_CANCELED;
                                call.reject(msg.toString(), cancelled ? "cancelled" : "error");
                            }
                        });
                prompt.authenticate(info.build());
            } catch (Exception e) {
                call.reject(e.getMessage() == null ? "Couldn't show the unlock prompt" : e.getMessage(), "error");
            }
        });
    }

    /** "Sign in with Google" using the phone's Google accounts; returns an ID token for Firebase. */
    @PluginMethod
    public void googleSignIn(PluginCall call) {
        String webClientId = call.getString("webClientId");
        if (webClientId == null || webClientId.isEmpty()) {
            call.reject("Missing webClientId", "error");
            return;
        }
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManager manager = CredentialManager.create(getContext());
        manager.getCredentialAsync(getActivity(), request, null, ContextCompat.getMainExecutor(getContext()),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        Credential credential = response.getCredential();
                        if (credential instanceof CustomCredential
                                && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                            try {
                                GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(credential.getData());
                                JSObject out = new JSObject();
                                out.put("idToken", google.getIdToken());
                                out.put("email", google.getId());
                                call.resolve(out);
                            } catch (Exception e) {
                                call.reject("Google sign-in returned an unreadable answer", "error");
                            }
                        } else {
                            call.reject("Google sign-in returned an unexpected answer", "error");
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        if (e instanceof GetCredentialCancellationException) call.reject("cancelled", "cancelled");
                        else call.reject(e.getMessage() == null ? "Google sign-in failed" : e.getMessage(), "error");
                    }
                });
    }

    /* ---------- Google Play Billing (Kept Pro / Pro+): Billing Library 8 ---------- */
    private BillingClient billing;
    private boolean billingConnecting = false;
    private final List<Object[]> billingWaiting = new ArrayList<>();   // {PluginCall, Runnable} waiting for the connection
    private final Map<String, ProductDetails> productCache = new HashMap<>();
    private PluginCall pendingBuy;

    private void withBilling(PluginCall call, Runnable task) {
        if (billing == null) {
            billing = BillingClient.newBuilder(getContext())
                    .setListener(this::onPurchasesUpdated)
                    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                    .enableAutoServiceReconnection()
                    .build();
        }
        if (billing.isReady()) { task.run(); return; }
        billingWaiting.add(new Object[]{call, task});
        if (billingConnecting) return;
        billingConnecting = true;
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                billingConnecting = false;
                List<Object[]> queue = new ArrayList<>(billingWaiting);
                billingWaiting.clear();
                boolean ok = result.getResponseCode() == BillingClient.BillingResponseCode.OK;
                for (Object[] w : queue) {
                    if (ok) ((Runnable) w[1]).run();
                    else ((PluginCall) w[0]).reject("Google Play billing isn't available on this device", "unavailable");
                }
            }

            @Override
            public void onBillingServiceDisconnected() { billingConnecting = false; }   // auto-reconnection handles the next call
        });
    }

    private static List<String> strings(JSArray a) {
        List<String> out = new ArrayList<>();
        if (a == null) return out;
        for (int i = 0; i < a.length(); i++) { String v = a.optString(i, null); if (v != null && !v.isEmpty()) out.add(v); }
        return out;
    }

    private interface DetailsDone { void done(String error); }

    /** Looks up products of one type and caches them (Play needs one query per product type). */
    private void queryDetails(List<String> ids, String type, DetailsDone done) {
        if (ids.isEmpty()) { done.done(null); return; }
        List<QueryProductDetailsParams.Product> list = new ArrayList<>();
        for (String id : ids) list.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(type).build());
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(list).build(), (result, details) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { done.done(result.getDebugMessage()); return; }
            for (ProductDetails d : details.getProductDetailsList()) productCache.put(d.getProductId(), d);
            done.done(null);
        });
    }

    /** The base plan of a subscription (the offer without an offer id), else the first offer. */
    private static ProductDetails.SubscriptionOfferDetails basePlan(ProductDetails d) {
        List<ProductDetails.SubscriptionOfferDetails> offers = d.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        for (ProductDetails.SubscriptionOfferDetails o : offers) if (o.getOfferId() == null) return o;
        return offers.get(0);
    }

    private static JSObject describe(ProductDetails d) {
        JSObject o = new JSObject();
        o.put("id", d.getProductId());
        o.put("type", d.getProductType());
        o.put("title", d.getName());
        if (BillingClient.ProductType.SUBS.equals(d.getProductType())) {
            ProductDetails.SubscriptionOfferDetails plan = basePlan(d);
            if (plan != null) {
                List<ProductDetails.PricingPhase> phases = plan.getPricingPhases().getPricingPhaseList();
                ProductDetails.PricingPhase p = phases.get(phases.size() - 1);   // the recurring price
                o.put("price", p.getFormattedPrice());
                o.put("currency", p.getPriceCurrencyCode());
                o.put("micros", p.getPriceAmountMicros());
            }
        } else {
            ProductDetails.OneTimePurchaseOfferDetails one = d.getOneTimePurchaseOfferDetails();
            if (one != null) {
                o.put("price", one.getFormattedPrice());
                o.put("currency", one.getPriceCurrencyCode());
                o.put("micros", one.getPriceAmountMicros());
            }
        }
        return o;
    }

    /** Prices and names of Kept's products, as set in Play Console (local currency). */
    @PluginMethod
    public void billingProducts(PluginCall call) {
        List<String> subs = strings(call.getArray("subs")), inapp = strings(call.getArray("inapp"));
        withBilling(call, () -> {
            AtomicInteger left = new AtomicInteger(2);
            String[] err = {null};
            DetailsDone each = e -> {
                if (e != null) err[0] = e;
                if (left.decrementAndGet() > 0) return;
                JSArray out = new JSArray();
                for (String id : subs) if (productCache.containsKey(id)) out.put(describe(productCache.get(id)));
                for (String id : inapp) if (productCache.containsKey(id)) out.put(describe(productCache.get(id)));
                if (out.length() == 0 && err[0] != null) { call.reject(err[0], "error"); return; }
                JSObject r = new JSObject(); r.put("products", out); call.resolve(r);
            };
            queryDetails(subs, BillingClient.ProductType.SUBS, each);
            queryDetails(inapp, BillingClient.ProductType.INAPP, each);
        });
    }

    /** Opens Google Play's purchase sheet for one product. Resolves with the purchase token. */
    @PluginMethod
    public void billingBuy(PluginCall call) {
        String id = call.getString("id"), type = call.getString("type", BillingClient.ProductType.SUBS);
        if (id == null || id.isEmpty()) { call.reject("Missing product id", "error"); return; }
        if (pendingBuy != null) { call.reject("A purchase is already in progress", "busy"); return; }
        withBilling(call, () -> {
            Runnable launch = () -> {
                ProductDetails d = productCache.get(id);
                if (d == null) { call.reject("This product isn't available yet", "unavailable"); return; }
                BillingFlowParams.ProductDetailsParams.Builder pp = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d);
                if (BillingClient.ProductType.SUBS.equals(d.getProductType())) {
                    ProductDetails.SubscriptionOfferDetails plan = basePlan(d);
                    if (plan == null) { call.reject("This subscription has no plan", "unavailable"); return; }
                    pp.setOfferToken(plan.getOfferToken());
                }
                BillingFlowParams params = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(pp.build())).build();
                getActivity().runOnUiThread(() -> {
                    pendingBuy = call;
                    BillingResult r = billing.launchBillingFlow(getActivity(), params);
                    if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        pendingBuy = null;
                        if (r.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) { JSObject o = new JSObject(); o.put("owned", true); call.resolve(o); }
                        else call.reject(r.getDebugMessage().isEmpty() ? "Couldn't open Google Play" : r.getDebugMessage(), "error");
                    }
                });
            };
            if (productCache.containsKey(id)) launch.run();
            else queryDetails(Collections.singletonList(id), type, e -> launch.run());
        });
    }

    private void acknowledge(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || p.isAcknowledged()) return;
        billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
    }

    private static JSObject describe(Purchase p) {
        JSObject o = new JSObject();
        o.put("id", p.getProducts().isEmpty() ? "" : p.getProducts().get(0));
        o.put("token", p.getPurchaseToken());
        o.put("pending", p.getPurchaseState() == Purchase.PurchaseState.PENDING);
        o.put("autoRenewing", p.isAutoRenewing());
        return o;
    }

    private void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        if (purchases != null) for (Purchase p : purchases) acknowledge(p);   // Google refunds purchases not acknowledged within 3 days
        PluginCall call = pendingBuy;
        pendingBuy = null;
        if (call == null) return;
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) call.resolve(describe(purchases.get(0)));
        else if (code == BillingClient.BillingResponseCode.USER_CANCELED) call.reject("cancelled", "cancelled");
        else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) { JSObject o = new JSObject(); o.put("owned", true); call.resolve(o); }
        else call.reject(result.getDebugMessage().isEmpty() ? "The purchase didn't go through" : result.getDebugMessage(), "error");
    }

    /** Kept products this Google account owns right now (active subscriptions and the lifetime purchase). */
    @PluginMethod
    public void billingPurchases(PluginCall call) {
        withBilling(call, () -> {
            JSArray out = new JSArray();
            AtomicInteger left = new AtomicInteger(2);
            String[] err = {null};
            for (String type : new String[]{BillingClient.ProductType.SUBS, BillingClient.ProductType.INAPP}) {
                billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(type).build(), (result, list) -> {
                    synchronized (out) {
                        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                            for (Purchase p : list) {
                                acknowledge(p);
                                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) out.put(describe(p));
                            }
                        } else err[0] = result.getDebugMessage();
                        if (left.decrementAndGet() > 0) return;
                        if (out.length() == 0 && err[0] != null) { call.reject(err[0], "error"); return; }
                        JSObject r = new JSObject(); r.put("purchases", out); call.resolve(r);
                    }
                });
            }
        });
    }
}
