/*
    Create by syxme 24.10.2024

    install https://emscripten.org/docs/getting_started/downloads.html
.\emsdk\upstream\emscripten\emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1

    emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_printAreaFlagsToBitmap","_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1
*/

#include <stdint.h>


// #include <wasm_simd128.h>


uint32_t fastAlphaBlendR(uint32_t src, uint32_t dest) {

    if ((dest >> 24)  == 0) {
        return src;
    }

    uint8_t alpha = (src >> 24);

    if (alpha == 0) return dest;

    int invAlpha = 255 - alpha;

    uint8_t srcR = (src >> 16) & 0xFF;
    uint8_t srcG = (src >> 8) & 0xFF;
    uint8_t srcB = src & 0xFF;

    uint8_t destR = (dest >> 16) & 0xFF;
    uint8_t destG = (dest >> 8) & 0xFF;
    uint8_t destB = dest & 0xFF;
    uint8_t destA = (dest >> 24);

    uint8_t outR = (srcR * alpha + destR * invAlpha) >> 8;
    uint8_t outG = (srcG * alpha + destG * invAlpha) >> 8;
    uint8_t outB = (srcB * alpha + destB * invAlpha) >> 8;
    uint8_t outA = alpha + ((destA * invAlpha) >> 8);

    return (outA << 24) | (outR << 16) | (outG << 8) | outB;
};


uint32_t* valueColors = 0;
uint32_t* usageColors = 0;

void setColors(uint32_t* mValueColors, uint32_t* mUsageColors) {
    valueColors = mValueColors;
    usageColors = mUsageColors;
}


#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define CLAMP(n, lower, upper) (MAX(lower, MIN(n, upper)))



//120 ms

void drawFlagBitmapStatic2(
    uint8_t* output, uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,int originalWidth,int originalHeight, int clipLeft, int clipTop, int clipRight, int clipBottom){
    uint32_t blendedColor = 0;


    uint32_t* l0_data       = (uint32_t*)(layers[0]);
    uint32_t* l0_colors     = (uint32_t*)layersFlagColors[0];
    int l0_visible          = layersVisibleMasks[0];
    int l0_maxCount         = maxCount[0];


    uint32_t* l1_data       = (uint32_t*)(layers[1]);
    uint32_t* l1_colors     = (uint32_t*)layersFlagColors[1];
    int l1_visible          = layersVisibleMasks[1];
    int l1_maxCount         = maxCount[1];




    uint32_t value0 = 0;
    uint32_t value1 = 0;



    uint32_t bit0 = 0;
    uint32_t bit1 = 0;
    uint32_t bit2 = 0;
    uint32_t bit3 = 0;




    uint32_t invHeight = originalHeight - 1;

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalHeight;
        int invertLine = y * originalHeight;
        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            blendedColor = 0;
            value0 = l0_data[index] & l0_visible;
            value1 = l1_data[index] & l1_visible;

            // value0 = *(uint32_t*)(l0_data + index) & l0_visible;
            // value1 = *(uint32_t*)(l1_data + index) & l1_visible;
            // value1 = l1_data[index] & l1_visible;
//             uint32_t bitPosition = index << l1_shiftAmount;
//             value1 = l1_data[bitPosition >> 5] >> (l1_endian_offset - (bitPosition % 32)) & l1_end_mask;

            if (value0) {
                for (int flag = 0; flag < l0_maxCount ; flag += 4) { //- 206
                    bit0 = 1 << flag;
                    bit1 = 1 << (flag + 1);
                    bit2 = 1 << (flag + 2);
                    bit3 = 1 << (flag + 3);

                    if ((value0 & bit0)) {
                         blendedColor = fastAlphaBlendR(l0_colors[flag],blendedColor);
                    }
                    if ((value0 & bit1)) {
                        blendedColor = fastAlphaBlendR(l0_colors[flag+1],blendedColor);
                    }
                    if ((value0 & bit2)) {
                        blendedColor = fastAlphaBlendR(l0_colors[flag+2],blendedColor);
                    }
                    if ((value0 & bit3)) {
                        blendedColor = fastAlphaBlendR(l0_colors[flag+3],blendedColor);
                    }
                }
            }

            if (value1) {
                for (int flag = 0; flag < l1_maxCount ; flag += 4) { //- 206

                    bit0 = 1 << flag ;
                    bit1 = 1 << (flag + 1) ;
                    bit2 = 1 << (flag + 2) ;
                    bit3 = 1 << (flag + 3) ;

                    if (value1 & bit0) {
                        blendedColor = fastAlphaBlendR(l1_colors[flag],blendedColor);
                    }
                    if (value1 & bit1) {
                        blendedColor = fastAlphaBlendR(l1_colors[flag+1],blendedColor);
                    }
                    if (value1 & bit2) {
                        blendedColor = fastAlphaBlendR(l1_colors[flag+2],blendedColor);
                    }
                    if (value1 & bit3) {
                        blendedColor = fastAlphaBlendR(l1_colors[flag+3],blendedColor);
                    }
                }

            }

            // output[invertLine + x] = blendedColor;//slow 
           *((uint32_t*)(output + ((invertLine + x) <<2 ))) = blendedColor;
        //    *((uint32_t*)(output + ((invertLine + x) << 2))) = blendedColor2;
        }
    }
}


void drawFlagBitmap(
    uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,
    int originalWidth,int originalHeight, int clipLeft, int clipTop, int clipRight, int clipBottom) {

    if (layersCount == 2){
        return drawFlagBitmapStatic2(output,layers,layersCount,layersDepths,layersVisibleMasks,maxCount,layersFlagColors,originalWidth,originalHeight, clipLeft, clipTop, clipRight,  clipBottom);
    }
    uint32_t blendedColor = 0;

    uint32_t invHeight = originalHeight - 1;

    uint32_t value = 0;

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalHeight;
        int invertLine = y * originalHeight;

        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            blendedColor = 0;

            for (int l = 0; l < layersCount; l++){

                uint32_t visibleFlagsMask = layersVisibleMasks[l];
                value = (((uint32_t*)layers[l])[index]) & visibleFlagsMask;

                uint32_t* layerColors = (uint32_t*)layersFlagColors[l];
             
                if (value) {
                    for (int flag = 0; flag < maxCount[l] ; flag += 4) { //- 206
                        uint32_t bit0 = 1 << flag;
                        uint32_t bit1 = 1 << (flag + 1);
                        uint32_t bit2 = 1 << (flag + 2);
                        uint32_t bit3 = 1 << (flag + 3);

                        if ((value & bit0)) {
                            blendedColor = fastAlphaBlendR(layerColors[flag],blendedColor);
                        }
                        if ((value & bit1) ) {
                            blendedColor = fastAlphaBlendR(layerColors[flag+1],blendedColor);
                        }
                        if ((value & bit2)) {
                            blendedColor = fastAlphaBlendR(layerColors[flag+2],blendedColor);
                        }
                        if ((value & bit3)) {
                            blendedColor = fastAlphaBlendR(layerColors[flag+3],blendedColor);
                        }
                    }
                }
            }

            *((uint32_t*)(output + ((invertLine + x) << 2))) = blendedColor;
        }
    }
}


void drawHorizontalLine(int x1, int x2, int y, uint32_t* mBuffer, int width, int height, uint32_t setBit,uint32_t drawMode) {
   

    if (y>height-1 || y <0){
        return;
    }
    int line = (height - y - 1) * height;
    x1 = CLAMP(x1, 0, width) + line;
    x2 = CLAMP(x2, 0, width) + line;
  

    switch (drawMode){
        case 0:{ // стираем бит 
            for (int x = x1; x < x2; x++) mBuffer[x] &= ~setBit;
            break;
        }
        case 1:{ //рисуем бит 
            for (int x = x1; x < x2; x++) mBuffer[x] |= setBit;
            break;
        }
        case 3:{ //рисуем бит и стираем другие
            for (int x = x1; x < x2; x++) mBuffer[x] = setBit;
            break;
        }
    }

}

void drawFilledCircle(int xc, int yc, int radius, uint32_t* mBuffer, int width, int height, uint32_t setBit,uint32_t drawMode) {
    int x = 0;
    int y = radius;
    int d = 3 - 2 * radius;
        while (y >= x) {
            drawHorizontalLine(xc - x, xc + x, yc + y, mBuffer, width, height, setBit,drawMode);
            drawHorizontalLine(xc - x, xc + x, yc - y, mBuffer, width, height, setBit,drawMode);
            drawHorizontalLine(xc - y, xc + y, yc + x, mBuffer, width, height, setBit,drawMode);
            drawHorizontalLine(xc - y, xc + y, yc - x, mBuffer, width, height, setBit,drawMode);

            x++;

            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }
}