import json
import re
from playwright.sync_api import sync_playwright

INDEX_URL = "https://www.fidal.it/risultati/2026/REG44788/Iscrizioni/IndexPerGara.html"
BASE_URL = "https://www.fidal.it/risultati/2026/REG44788/Iscrizioni/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
        page = context.new_page()
        
        print("Visiting Index...")
        page.goto(INDEX_URL)
        page.wait_for_timeout(2000) # Wait a bit for JS execution
        
        # We need to extract the links to GaraL*.html
        links = page.locator("a[href^='GaraL']").element_handles()
        hrefs = []
        for link in links:
            hrefs.append(link.get_attribute("href"))
            
        print(f"Found {len(hrefs)} race links.")
        print(hrefs)
        
        # Also print the HTML just in case
        with open("index_dump.html", "w", encoding="utf-8") as f:
            f.write(page.content())
            
        browser.close()

if __name__ == "__main__":
    main()
