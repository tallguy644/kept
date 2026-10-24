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
 * share a backup/export file, print the tax report, fingerprint/face/screen-lock prompt, and Google sign-in.
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
}
