let sa = 0
let sr = 0
let sg = 0
let sb = 0



let da = 0
let dr = 0
let dg = 0
let db = 0

let invSa = 0
let rem = 0

export function FastBlend(src, dest) {
    da = dest[3];
    if (da === 0) {
        dest[0] = src[0]
        dest[1] = src[1]
        dest[2] = src[2]
        dest[3] = src[3]
        return;
    }
    sa = src[3];
    if (sa === 255) {
        dest[0] = src[0]
        dest[1] = src[1]
        dest[2] = src[2]
        dest[3] = src[3]
        return;
    }
    sr = src[0];
    sg = src[1];
    sb = src[2];


    dr = dest[0];
    dg = dest[1];
    db = dest[2];


    invSa = 255 - sa;
    rem = da * invSa / 255
    dest[3] =  sa + (rem >> 8);
    dest[0] = (sr * sa + dr * rem + 127) >> 8;
    dest[1] = (sg * sa + dg * rem + 127) >> 8;
    dest[2] = (sb * sa + db * rem + 127) >> 8;

}