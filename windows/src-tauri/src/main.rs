// Kept for Gig Workers - Windows app (Microsoft Store).
// A standalone window (Tauri + the WebView2 engine built into Windows) that shows keptforgigworkers.com, so it works
// offline after the first start (the site's service worker) and updates with the website. It doesn't need the Edge browser.
// Native extras for the web app (windows.js): Microsoft Store purchases for Kept Pro, and opening links outside the app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod store;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            store::store_products,
            store::store_buy,
            store::store_purchases,
            store::open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kept");
}
