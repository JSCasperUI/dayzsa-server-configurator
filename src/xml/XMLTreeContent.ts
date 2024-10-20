import {ELEMENT, EOF, HTMLParser} from "@dz/xml/HTMLParser";
export interface BXNodeContent {
    tag:string;
    text:string|null
    children:Array<BXNodeContent>;
    attrs:Record<string, string|number>|null,
    line:number
}
export function xml2TreeContent(xmlParser:HTMLParser,node?:BXNodeContent,depth = 0):BXNodeContent{
    var status = 0

    if (xmlParser.getDepth() === 0){
        xmlParser.next()
    }
    let xmlNode = xmlParser.getFullTag()
    let content = xmlNode.content
    let child = {tag:xmlNode.name,text:null,attrs:{},children:[],line:xmlNode.line} as BXNodeContent
    if (xmlNode.attributes.length>0){
        child.attrs = {}
        for (const attribute of xmlNode.attributes) {
            child.attrs[attribute.name] = attribute.value
        }
    }



    if (node!=null && content.length===0){
        node.children.push(child)

    }else {
        if (content.length!==0){
            node.text = content
        }

        node = child
    }
    while ((status = xmlParser.next()) !== EOF && xmlParser.getDepth() > depth){
        if (status !== ELEMENT){
            continue
        }
        if (status === ELEMENT){
            xml2TreeContent(xmlParser,child,depth + 1)
        }else{
            break
        }

    }


    return node
}


export function parseXMLString(input:string){
    let parser = new HTMLParser()
    parser.mInput = input
    return xml2TreeContent(parser)
}