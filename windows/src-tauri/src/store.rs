// Microsoft Store add-on purchases (Kept Pro) through Windows.Services.Store, and opening links in the default browser.
// Add-ons are matched by their product ID in Partner Center (InAppOfferToken), e.g. "kept_pro_monthly".
use serde::Serialize;
use std::sync::Mutex;

/// (product ID, Store ID) for every add-on, filled by store_products and used by store_buy.
static SKUS: Mutex<Vec<(String, String)>> = Mutex::new(Vec::new());

#[derive(Serialize)]
pub struct Product {
    id: String,
    price: String,
    #[serde(rename = "storeId")]
    store_id: String,
}

#[derive(Serialize)]
pub struct Owned {
    id: String,
    token: String,
}

fn hwnd_of(w: &tauri::WebviewWindow) -> Result<isize, String> {
    #[cfg(windows)]
    {
        w.hwnd().map(|h| h.0 as isize).map_err(|e| e.to_string())
    }
    #[cfg(not(windows))]
    {
        let _ = w;
        Err("Windows only".into())
    }
}

#[tauri::command]
pub async fn store_products(window: tauri::WebviewWindow, ids: Vec<String>) -> Result<Vec<Product>, String> {
    let h = hwnd_of(&window)?;
    tauri::async_runtime::spawn_blocking(move || imp::products(h, ids)).await.map_err(|e| e.to_string())?
}

/// Returns "purchased", "owned", "cancelled", "network" or "failed".
#[tauri::command]
pub async fn store_buy(window: tauri::WebviewWindow, id: String) -> Result<String, String> {
    let h = hwnd_of(&window)?;
    tauri::async_runtime::spawn_blocking(move || imp::buy(h, id)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn store_purchases(window: tauri::WebviewWindow) -> Result<Vec<Owned>, String> {
    let h = hwnd_of(&window)?;
    tauri::async_runtime::spawn_blocking(move || imp::purchases(h)).await.map_err(|e| e.to_string())?
}

/// Opens a web page, email or Store link outside the app. Only these kinds of links are allowed.
#[tauri::command]
pub fn open_external(url: String) -> Result<(), String> {
    let allowed = ["https://", "http://", "mailto:", "ms-windows-store:"];
    if url.len() > 4096 || !allowed.iter().any(|p| url.starts_with(p)) {
        return Err("blocked".into());
    }
    #[cfg(windows)]
    unsafe {
        use windows::core::{HSTRING, PCWSTR};
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;
        let file = HSTRING::from(url.as_str());
        let op = HSTRING::from("open");
        ShellExecuteW(HWND::default(), &op, &file, PCWSTR::null(), PCWSTR::null(), SW_SHOWNORMAL);
    }
    Ok(())
}

#[cfg(windows)]
mod imp {
    use super::{Owned, Product, SKUS};
    use windows::core::{Interface, HSTRING};
    use windows::Foundation::Collections::IIterable;
    use windows::Services::Store::{StoreContext, StorePurchaseStatus};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::Shell::IInitializeWithWindow;

    // The Store's purchase dialog belongs to the Kept window.
    fn ctx(h: isize) -> windows::core::Result<StoreContext> {
        let c = StoreContext::GetDefault()?;
        let init: IInitializeWithWindow = c.cast()?;
        unsafe { init.Initialize(HWND(h as *mut core::ffi::c_void))? };
        Ok(c)
    }

    pub fn products(h: isize, ids: Vec<String>) -> Result<Vec<Product>, String> {
        let run = || -> windows::core::Result<Vec<Product>> {
            let c = ctx(h)?;
            let kinds: IIterable<HSTRING> = vec![
                HSTRING::from("Durable"),
                HSTRING::from("Consumable"),
                HSTRING::from("UnmanagedConsumable"),
            ]
            .try_into()?;
            let res = c.GetAssociatedStoreProductsAsync(&kinds)?.get()?;
            let map = res.Products()?;
            let (mut out, mut skus) = (Vec::new(), Vec::new());
            let it = map.First()?;
            while it.HasCurrent()? {
                let p = it.Current()?.Value()?;
                let id = p.InAppOfferToken()?.to_string();
                let store_id = p.StoreId()?.to_string();
                let price = p.Price()?.FormattedPrice()?.to_string();
                skus.push((id.clone(), store_id.clone()));
                if ids.is_empty() || ids.contains(&id) {
                    out.push(Product { id, price, store_id });
                }
                it.MoveNext()?;
            }
            *SKUS.lock().unwrap() = skus;
            Ok(out)
        };
        run().map_err(|e| format!("{e}"))
    }

    pub fn buy(h: isize, id: String) -> Result<String, String> {
        let find = || SKUS.lock().unwrap().iter().find(|(p, _)| *p == id).map(|(_, s)| s.clone());
        let store_id = match find() {
            Some(s) => s,
            None => {
                products(h, Vec::new())?;
                find().ok_or_else(|| "unknown product".to_string())?
            }
        };
        let run = || -> windows::core::Result<String> {
            let res = ctx(h)?.RequestPurchaseAsync(&HSTRING::from(store_id.as_str()))?.get()?;
            let s = res.Status()?;
            Ok(if s == StorePurchaseStatus::Succeeded {
                "purchased"
            } else if s == StorePurchaseStatus::AlreadyPurchased {
                "owned"
            } else if s == StorePurchaseStatus::NotPurchased {
                "cancelled"
            } else if s == StorePurchaseStatus::NetworkError {
                "network"
            } else {
                "failed"
            }
            .to_string())
        };
        run().map_err(|e| format!("{e}"))
    }

    pub fn purchases(h: isize) -> Result<Vec<Owned>, String> {
        let run = || -> windows::core::Result<Vec<Owned>> {
            let lic = ctx(h)?.GetAppLicenseAsync()?.get()?;
            let map = lic.AddOnLicenses()?;
            let mut out = Vec::new();
            let it = map.First()?;
            while it.HasCurrent()? {
                let l = it.Current()?.Value()?;
                if l.IsActive()? {
                    out.push(Owned { id: l.InAppOfferToken()?.to_string(), token: l.SkuStoreId()?.to_string() });
                }
                it.MoveNext()?;
            }
            Ok(out)
        };
        run().map_err(|e| format!("{e}"))
    }
}

#[cfg(not(windows))]
mod imp {
    use super::{Owned, Product};
    pub fn products(_: isize, _: Vec<String>) -> Result<Vec<Product>, String> { Err("Windows only".into()) }
    pub fn buy(_: isize, _: String) -> Result<String, String> { Err("Windows only".into()) }
    pub fn purchases(_: isize) -> Result<Vec<Owned>, String> { Err("Windows only".into()) }
}
