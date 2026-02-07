class Styling {
    constructor(data) {
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        this.successColor = data.successColor;
        this.infoColor = data.infoColor;
        this.warningColor = data.warningColor;
        this.dangerColor = data.dangerColor;
        this.mainFont = data.mainFont;
        this.display1Font = data.display1Font;
        this.display1Size = data.display1Size;
        this.display2Font = data.display2Font;
        this.display2Size = data.display2Size;
        this.display5Font = data.display5Font;
        this.display5Size = data.display5Size;
        this.display7Font = data.display7Font;
        this.display7Size = data.display7Size;
        this.display4Font = data.display4Font;
        this.display4Size = data.display4Size;
        this.isRoundedButtons = data.isRoundedButtons;
        this.isGhostButtonBorder = data.isGhostButtonBorder;
        this.underlinedLinks = data.underlinedLinks;
        this.isAnimatedOnScroll = data.isAnimatedOnScroll;
        this.isScrollToTopButton = data.isScrollToTopButton;
    }
}

class Theme {
    constructor(data) {
        this.name = data.name;
        this.title = data.title;
        this.styling = new Styling(data.styling);
        this.titlePreset = data.titlePreset;
        this.nameSelectPreset = data.nameSelectPreset;
        this.presetSourceTheme = data.presetSourceTheme;
        this.additionalSetColors = data.additionalSetColors;
    }
}

class SiteFont {
    constructor(data) {
        this.css = data.css;
        this.name = data.name;
        this.url = data.url;
    }
}

class CookiesAlert {
    constructor(data) {
        this.customDialogSelector = data.customDialogSelector;
        this.colorText = data.colorText;
        this.colorBg = data.colorBg;
        this.colorButton = data.colorButton;
        this.colorLink = data.colorLink;
        this.underlineLink = data.underlineLink;
        this.opacity = data.opacity;
        this.opacityOverlay = data.opacityOverlay;
        this.text = data.text;
        this.textButton = data.textButton;
        this.rejectColor = data.rejectColor;
        this.bgOpacity = data.bgOpacity;
        this.rejectText = data.rejectText;
    }
}

class Settings {
    constructor(data) {
        this.currentPage = data.currentPage;
        this.theme = new Theme(data.theme);
        this.path = data.path;
        this.name = data.name;
        this.versionFirst = data.versionFirst;
        this.siteFonts = data.siteFonts.map(font => new SiteFont(font));
        this.uniqCompNum = data.uniqCompNum;
        this.versionPublish = data.versionPublish;
        this.screenshot = data.screenshot;
        this.imageResize = data.imageResize;
        this.favicon = data.favicon;
        this.mbrsiteDomain = data.mbrsiteDomain;
        this.robotsSwitcher = data.robotsSwitcher;
        this.sitemapSwitcher = data.sitemapSwitcher;
        this.sitemapSwitcherAuto = data.sitemapSwitcherAuto;
        this.siteUrl = data.siteUrl;
        this.cookiesAlert = new CookiesAlert(data.cookiesAlert);
        this.extra = { ...data };
    }
}

class Component {
    constructor(data) {
        this.alias = data.alias;
        this._styles = data._styles;
        this._name = data._name;
        this._sourceTheme = data._sourceTheme;
        this._customHTML = data._customHTML;
        this._cid = data._cid;
        this._anchor = data._anchor;
        this._protectedParams = data._protectedParams;
        this._global = data._global;
        this._once = data._once;
        this._params = data._params;
    }
}

class PageSettings {
    constructor(data) {
        this.main = data.main;
        this.title = data.title;
        this.meta_descr = data.meta_descr;
        this.header_custom = data.header_custom;
        this.footer_custom = data.footer_custom;
        this.html_before = data.html_before;
    }
}

class Page {
    constructor(data) {
        this.settings = new PageSettings(data.settings);
        this.components = data.components.map(component => new Component(component));
    }
}

class Config {
    constructor(data) {
        this.settings = new Settings(data.settings);
        this.pages = {};
        for (const page in data.pages) {
            if (data.pages.hasOwnProperty(page)) {
                this.pages[page] = new Page(data.pages[page]);
            }
        }
    }
}

module.exports = Config;
