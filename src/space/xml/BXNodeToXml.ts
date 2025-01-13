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
export function highlightXml(xml, format = true) {
    function addIndentation(depth) {
        return format ? '&nbsp;'.repeat(depth * 4) : '';
    }

    // Основная логика подсветки
    function processXml(line, depth = 0) {
        return line
            .replace(
                /(<\/?)([a-zA-Z0-9_-]+)(\s[^<>]*)?(\/?>)/g, // Поиск тегов
                function (match, open, tagName, attrs = '', close) {


                    open = open.replace(/</g, '&lt;') // Экранирование угловых скобок
                    close = close.replace(/>/g, '&gt;') // Экранирование угловых скобок;
                    const highlightedAttrs = attrs.replace(
                        /(\w+)="(.*?)"/g, // Поиск атрибутов
                        `<span class="a">$1</span>=<span class="s">&quot;$2&quot;</span>`
                    );

                    // Форматирование с переносами строк и отступами
                    const lineBreak = format ? '<br>' : '';
                    const indentation = addIndentation(depth);

                    if (close.includes('/')) {
                        return `${lineBreak}${indentation}${open}<span class="t">${tagName}</span>${highlightedAttrs}${close}`;
                    }

                    if (open.includes('/')) {
                        return `${lineBreak}${indentation}${open}<span class="t">${tagName}${close}</span>`;
                    }

                    return `${lineBreak}${indentation}${open}<span class="t">${tagName}</span>${highlightedAttrs}${close}`;
                }
            )
            .replace(
                /(&gt;)([^<&]+?)(&lt;)/g, // Поиск текста между тегами
                function (_, open, text, close) {
                    const lineBreak = format ? '<br>' : '';
                    const indentation = addIndentation(depth + 1);
                    return `${open}${lineBreak}${indentation}<span class="text">${text.trim()}</span>${lineBreak}${close}`;
                }
            )
    }

    let formattedXml = '';
    const lines = xml.split(/(?=<)/g); // Разделение по тегам
    let depth = 0;
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (/^<\//.test(line)) {
            depth--;
        }

        formattedXml += processXml(line, depth);
        if (/^<[^/!?].*>/.test(line) && !/<\/.*?>/.test(line)) {
            depth++;
        }
    }
    console.log(formattedXml)
    return formattedXml;
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
