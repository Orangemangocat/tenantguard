#!/usr/bin/env python

from playwright.sync_api import sync_playwright

URL = "https://dev.tenantguard.net"  # change to your dev server


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Use closest built-in device profile if you want real UA/touch settings.
        ipad = p.devices.get("iPad Mini")
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        page.goto(URL, wait_until="networkidle")
        page.set_viewport_size({"width": 430, "height": 932})  # iPhone 16-style size
        page.wait_for_timeout(1000)
        page.screenshot(path="ipad.png", full_page=True)
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
