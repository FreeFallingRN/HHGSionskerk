var Widget = /** @class */ (function () {
    function Widget(elem) {
        this._apihost = "https://api.kerktijden.nl/";
        this._webhost = "https://www.kerktijden.nl/";
        this._communityId = parseInt(elem.id.split('-').pop());
        this._container = elem.parentElement.appendChild(document.createElement("div"));
        this._weeks = elem.attributes['data-weken'].value;
        this._includeLocation = elem.attributes['data-locatie'] != null ? elem.attributes['data-locatie'].value == "true" || elem.attributes['data-locatie'].value == "1" : false;
        this._nopreachertext = elem.attributes['data-geenvoorganger'] != null ? elem.attributes['data-geenvoorganger'].value : "geen voorganger";
    }
    Widget.prototype.GetData = function () {
        var _this = this;
        var url = this._apihost + ("api/gathering/GetGatheringsForWidget?communityId=" + this._communityId + "&weeks=" + this._weeks);
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                _this.renderHtml(xhttp.responseText);
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
    };
    Widget.prototype.renderHtml = function (result) {
        var _a;
        var data = JSON.parse(result);
        var items = "";
        var oldGatheringDate = new Date((new Date().getDate()) - 1000);
        var communityName = "gemeente";
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var gathering = data_1[_i];
            var gatheringDate = new Date(gathering.startTime);
            var renderDate = false;
            communityName = gathering.communities.length > 0 ? this.slugify(gathering.communities[0].name) : "gemeente";
            if (gatheringDate.getDate() != oldGatheringDate.getDate() ||
                gatheringDate.getMonth() != oldGatheringDate.getMonth()) {
                renderDate = true;
                oldGatheringDate = gatheringDate;
            }
            if (gathering.persons.length == 0) {
                var link = "";
                items += "<li class='" + (renderDate ? "ktn-newdate" : "") + " '>\n                <span class='ktn-date'>\n                " + (renderDate ? this.formatDate(gathering.startTime) : "") + "\n                </span>\n                <span class='ktn-time'>\n                " + this.formatTime(gathering.startTime) + "\n                </span>\n                <span class='ktn-dienst " + this.getCancelled(gathering) + "'>" + this.formatGatheringTypes(gathering.gatheringTypes) + this.formatNotition(gathering.notition) + "</span>                \n                <span class='ktn-voorganger'>\n                " + this._nopreachertext + "\n                </span>\n                " + this.formatLocation(gathering) + "                \n                </li>";
            }
            if (gathering.persons.length > 0) {
                var status = gathering.persons[0].status != null ? gathering.persons[0].status.statusShort : "";
                var name = status + " " + gathering.persons[0].initials + " " + ((_a = gathering.persons[0].insertion) !== null && _a !== void 0 ? _a : '') + " " + gathering.persons[0].lastname;
                var slug = this.slugify(name);
                var link = "";
                if (gathering.persons[0].id === 1) {
                    link = "";
                }
                else {
                    link = "<a target='_blank' href='" + this._webhost + "voorganger/" + gathering.persons[0].id + "/" + slug + "'>" + name + "</a>";
                }
                items += "<li class='" + (renderDate ? "ktn-newdate" : "") + " '>\n                <span class='ktn-date'>\n                " + (renderDate ? this.formatDate(gathering.startTime) : "") + "\n                </span>\n                <span class='ktn-time'>\n                " + this.formatTime(gathering.startTime) + "\n                </span>\n                <span class='ktn-dienst " + this.getCancelled(gathering) + "'>" + this.formatGatheringTypes(gathering.gatheringTypes) + this.formatNotition(gathering.notition) + "</span>                \n                <span class='ktn-voorganger'>\n                " + link + "\n                </span>\n                " + this.formatLocation(gathering) + "                \n                </li>";
            }
        }
        var template = this.getBaseTemplate();
        var html = template.replace(/{items}/g, items).toString();
        html = html.replace(/{link}/g, this._webhost + "gemeente/" + this._communityId + "/" + communityName);
        html += this.getCss();
        this._container.innerHTML = html;
    };
    Widget.prototype.getBaseTemplate = function () {
        return "<ul class='ktn-gatherings'>{items}</ul>\n            <div class='ktn-more'><a target='_blank' href='{link}'><img src='https://www.kerktijden.nl/images/logo-green.svg'><span>Meer diensten op kerktijden.nl</span></a></div>";
    };
    Widget.prototype.getCancelled = function (gathering) {
        if (gathering.cancelled == 1)
            return "ktn-geannuleerd";
        return "";
    };
    Widget.prototype.formatLocation = function (gathering) {
        if (this._includeLocation == false)
            return "";
        if (gathering.deviatingLocation != null && gathering.deviatingLocation.indexOf('{') > -1) {
            var name = JSON.parse(gathering.deviatingLocation).Name;
            return "<span class='ktn-locatie'>" + name + "</span>";
        }
        if (gathering.locations == null || gathering.locations.length == 0)
            return "<span class='ktn-locatie'></span>";
        if (gathering.locations.length == 1 && gathering.locations[0].name == null)
            return "<span class='ktn-locatie'></span>";
        return "<span class='ktn-locatie'><span onclick=\"Widget.ShowLocation(this)\">" + gathering.locations[0].name + "</span>" + this.formatLocationDetails(gathering) + "</span>";
    };
    Widget.prototype.formatLocationDetails = function (gathering) {
        if (this._includeLocation == false)
            return "";
        if (gathering.locations == 0 || gathering.locations.length == 0)
            return "";
        var locationDetails = gathering.locations[0].street + " " + gathering.locations[0].number + "<br>" + gathering.locations[0].zipcode + " " + gathering.locations[0].town;
        var locationSlug = this.slugify(gathering.communities[0].name);
        var locationLink = "https://www.kerktijden.nl/gemeente/" + gathering.communities[0].id + "/" + locationSlug + "#church-information";
        return "<span class='ktn-locatie-details'>" + locationDetails + " <a target=\"_blank\" href=\"" + locationLink + "\">" + this.getDirectionsPin() + "</a></span>";
    };
    Widget.ShowLocation = function (evt) {
        if (evt.nextElementSibling.style.height == "auto") {
            evt.nextElementSibling.style.height = "0";
            evt.nextElementSibling.style.opacity = "0";
        }
        else {
            evt.nextElementSibling.style.height = "auto";
            evt.nextElementSibling.style.opacity = "1";
        }
    };
    Widget.prototype.formatDate = function (value) {
        var date = new Date(value);
        var days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
        var months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
        return days[date.getDay()] + " " + date.getDate() + " " + months[date.getMonth()];
    };
    Widget.prototype.formatTime = function (value) {
        value = value + "Z"; // interpret as UTC
        var tz = (new Date(value)).getTimezoneOffset();
        var date = new Date(new Date(value).getTime() + (60000 * tz));
        return (date.getHours() + 100).toString().substr(1, 2) + ":" + (date.getMinutes() + 100).toString().substr(1, 2);
    };
    Widget.prototype.formatGatheringTypes = function (gatheringTypes) {
        var html = "";
        var index = 0;
        for (var _i = 0, gatheringTypes_1 = gatheringTypes; _i < gatheringTypes_1.length; _i++) {
            var gatheringType = gatheringTypes_1[_i];
            //if (gatheringType.id == 170 || gatheringType.id == 175) continue;
            var name = gatheringType.name;
            if (index == 0)
                name = this.toTitle(gatheringType.name);
            if (index > 0)
                name = ", " + name;
            html += "<span class='ktn-type-" + gatheringType.id + "'>" + name + "</span>";
            index++;
        }
        html = html.trim();
        //html = html.replace(/,\s([^,]+)$/, '</span>');
        if (html.lastIndexOf(',') == html.length - 1) {
            html = html.substr(0, html.length - 1);
        }
        return this.toTitle(html);
    };
    Widget.prototype.toTitle = function (str) {
        return str.replace(/\.\s*([a-z])|^[a-z]/gm, function (s) { return s.toUpperCase(); });
    };
    Widget.prototype.formatNotition = function (notition) {
        if (notition == "" || notition == null)
            return "";
        return "<span class='ktn-notition'>" + notition + "</span>";
    };
    Widget.prototype.slugify = function (text) {
        var str = text.replace(/^\s+|\s+$/g, ""); // trim
        str = str.toLowerCase();
        // remove accents, swap ñ for n, etc
        var from = "åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to = "aaaaaaeeeeiiiioooouuuunc------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
        }
        str = str
            .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
            .replace(/\s+/g, "-") // collapse whitespace and replace by -
            .replace(/-+/g, "-") // collapse dashes
            .replace(/^-+/, "") // trim - from start of text
            .replace(/-+$/, ""); // trim - from end of text
        return str;
    };
    Widget.prototype.getCss = function () {
        var css = "<style>                \n               .ktn-gatherings {\n                    list-style: none;\n                    padding: 0 5px;\n                    font-size: 13px;        \n                }                \n                .ktn-gatherings li {\n                    margin-bottom:5px; \n                    line-height:25px;\n                }\n                .ktn-gatherings li span{vertical-align:text-top;}\n                .ktn-date {\n                    width: 85px;\n                    display: inline-block;\n                    min-height:10px;\n                }\n                .ktn-newdate {\n                    margin-top:15px;                    \n                }                \n                .ktn-time {\n                    margin-right: 10px;\n                    width:50px;\n                    display:inline-block;\n                }\n                .ktn-dienst{\n                    width:150px;\n                    display:inline-block;\n                    word-wrap: break-word;\n                }\n                .ktn-gatherings li span span {vertical-align: initial;}\n                .ktn-voorganger{display:inline-block;margin-left:15px;min-width:140px;}\n                .ktn-more img{height:25px!important;padding:5px;}\n                .ktn-more span {    padding: 1px;    }\n                .ktn-more a {display:flex;line-height:20px;}\n                .ktn-dienst.ktn-geannuleerd {opacity: 0.7;text-decoration: line-through;}\n                .ktn-notition {font-style: italic;float: left;}\n                .ktn-locatie {margin-left:10px;display:inline-block;}\n                .ktn-locatie>span:first-child {text-decoration:underline;cursor:pointer}\n                .ktn-locatie-details { text-decoration:none; display:block; transition: all 1s ease-in-out;opacity: 0;height:0;overflow:hidden;}\n                .ktn-locatie-details svg {height:20px;width:auto;display:block;text-decoration:none;}\n        </style>";
        return css;
    };
    Widget.prototype.getDirectionsPin = function () {
        return "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n\t width=\"512px\" height=\"512px\" viewBox=\"0 0 512 512\" enable-background=\"new 0 0 512 512\" xml:space=\"preserve\">\n<path d=\"M416,48c-44.188,0-80,35.813-80,80c0,11.938,2.625,23.281,7.313,33.438L416,304l72.688-142.563\n\tC493.375,151.281,496,139.938,496,128C496,83.813,460.188,48,416,48z M416,176c-26.5,0-48-21.5-48-48s21.5-48,48-48s48,21.5,48,48\n\tS442.5,176,416,176z M439.938,327.469l29.125,58.219l-73.844,36.906l-24.75-123.813l4.156-4.156l0.438-0.438l-15.25-30L352,272\n\tl-96-64l-96,64l-64-64L0,400l128,64l128-64l128,64l128-64l-54-107.969L439.938,327.469z M116.75,422.594l-73.813-36.906L104.75,262\n\tl32.625,32.625l4.156,4.156L116.75,422.594z M240,372.219l-89.5,44.75l23.125-115.594l4.125-2.75l62.25-41.5V372.219z M272,372.219\n\tV257.125l62.25,41.5l4.094,2.75l23.125,115.594L272,372.219z\"/>\n</svg>";
    };
    return Widget;
}());
var widget2 = new Widget(document.currentScript);
widget2.GetData();
//# sourceMappingURL=kerktijdenV2.js.map