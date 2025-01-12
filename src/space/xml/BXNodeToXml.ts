import {BXNodeContent} from "@dz/space/xml/XMLTreeContent";

export function BXNodeToXml(obj: BXNodeContent, skipRoot: boolean = false): string {
    let xml = '';

    function buildXml(obj: BXNodeContent, depth = 0) {
        const indent = '\t'.repeat(depth);
        if (skipRoot && obj.children && obj.children.length > 0) {
            obj.children.forEach(childNode => {
                buildXml(childNode, depth);
            });
        } else {
            xml += `${indent}<${obj.tag}`;
            if (obj.attrs) {
                for (let [key, value] of Object.entries(obj.attrs)) {
                    xml += ` ${key}="${value}"`;
                }
            }

            if (obj.text) {
                xml += `>${obj.text}</${obj.tag}>\n`;

            } else {
                if (obj.children && obj.children.length > 0) {
                    xml += '>\n';
                    obj.children.forEach(childNode => {
                        buildXml(childNode, depth + 1);
                    });
                    xml += `${indent}</${obj.tag}>\n`;
                } else {
                    xml += '/>\n';
                }
            }
        }
    }

    buildXml(obj);
    return xml;
}

export function BXNodeToHighlightedHtml(obj: BXNodeContent, skipRoot: boolean = false): string {
    let html = '';

    function buildHtml(obj: BXNodeContent, depth = 0) {
        const indent = '&nbsp;'.repeat(depth * 4);
        if (skipRoot && obj.children && obj.children.length > 0) {
            obj.children.forEach(childNode => {
                buildHtml(childNode, depth);
            });
        } else {
            html += `${indent}<span class="t">&lt;${obj.tag}</span>`;
            if (obj.attrs) {
                for (let [key, value] of Object.entries(obj.attrs)) {
                    html += ` <span class="a">${key}</span>=<span class="s">"${value}"</span>`;
                }
            }
            if (obj.text) {
                html += `<span class="t">&gt;</span>${obj.text}<span class="t">&lt;/${obj.tag}&gt;</span><br>`;
            } else {
                if (obj.children && obj.children.length > 0) {
                    html += `<span class="t">&gt;</span><br>`;
                    obj.children.forEach(childNode => {
                        buildHtml(childNode, depth + 1);
                    });
                    html += `${indent}<span class="t">&lt;/${obj.tag}&gt;</span><br>`;
                } else {
                    html += `<span class="t">/&gt;</span><br>`;
                }
            }
        }
    }

    buildHtml(obj);
    return html;
}
