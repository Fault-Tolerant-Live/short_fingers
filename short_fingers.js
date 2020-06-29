// Replace Donate Button

(async () => {
    const donateButton = document.getElementById('donatebtn').parentElement;
    const headerNav = document.getElementsByClassName('header-nav')[0].getElementsByTagName('ul')[0];

    var shortFingersListItem = new DOMParser()
        .parseFromString('<li><a class="btn" href="/products">Short Fingers</a></li>', "text/html")
        .getElementsByTagName('li')[0];

    headerNav.replaceChild(shortFingersListItem, donateButton);

    let sectionLinks = (await browser.storage.local.get('sectionLinks')).sectionLinks || [];

    if (document.location.pathname === '/products') {
        console.log('Product page detected');

        if (sectionLinks.length > 0 ) {
            console.log('Section links loaded from localStorage');
        } else {
            sectionLinks = scrapeSectionLinks(headerNav);
            await browser.storage.local.set({ sectionLinks });
        }
    }

    await processSections(sectionLinks);
})();

async function scrapeProductLinks(productLinks) {
    const productElements = document.getElementsByClassName('product');

    for (const productElement of productElements) {
        const productLink = productElement.children[0].getAttribute('href');

        if (productLinks.indexOf(productLink) == -1) {
            productLinks.push(productLink);
        }
    }

    return productLinks;
}

function scrapeSectionLinks(headerNav) {
    console.log('Scraping section links');

    const sectionLinks = [];
    const headerNavLinks = headerNav.getElementsByTagName('a');
    
    for (const navLink of headerNavLinks) {
        const href = navLink.getAttribute('href');
    
        if (href && href !== '#' && href !== '/cart') {
            sectionLinks.push(href);
        }
    }

    return sectionLinks;
}

async function processSections(sectionLinks) {
    console.log('Processing sections');

    let sectionLink = sectionLinks[0];

    let productLinks = (await browser.storage.local.get('productLinks')).productLinks || [];

    if (sectionLink) {
        if (sectionLink === window.location.pathname) {
            productLinks = await scrapeProductLinks(productLinks);
            console.log('productLinks', productLinks)
            await browser.storage.local.set({ productLinks });
            sectionLinks.splice(0, 1);
            sectionLink = sectionLinks[0];
            await browser.storage.local.set({ sectionLinks });
        }
    
        if (sectionLink) {
            window.location.pathname = sectionLink;
        } else {
            processProduct(productLinks);
        }
    } else if (productLinks.length > 0) {
        processProduct(productLinks);
    }
}

async function processProduct(productLinks) {
    let productLink = productLinks[0];
    
    if (productLink) {
        if (productLink === window.location.pathname) {
            const addToCartForm = document.querySelector('form[action="/cart/add"]');
            const submitButton = addToCartForm.querySelector('button[disabled="disabled"]');

            if (!submitButton) {
                addToCartForm.submit();
            } else {
                productLinks.splice(0, 1);
                await browser.storage.local.set({ productLinks });
                productLink = productLinks[0];
                if (productLink) {
                    window.location.pathname = productLink;
                } else {
                    console.log("DONE")
                }
            }
        } else if (window.location.pathname === '/cart') {
            productLinks.splice(0, 1);
            await browser.storage.local.set({ productLinks });
            productLink = productLinks[0];
            if (productLink) {
                window.location.pathname = productLink;
            } else {
                console.log("DONE")
            }
        } else {
            window.location.pathname = productLink;
        }
    }
}

function callApi(url, data, success) {
    var params = typeof data == 'string' ? data : Object.keys(data).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
        ).join('&');

    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open('POST', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState>3 && xhr.status==200) { success(xhr.responseText); }
    };
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(params);
    return xhr;
}