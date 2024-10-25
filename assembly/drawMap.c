/*
    Create by syxme 24.10.2024

    install https://emscripten.org/docs/getting_started/downloads.html

    emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_printAreaFlagsToBitmap","_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1
*/

#include <stdint.h>


int log22(uint32_t n) {
    int result = 0;
    while (n > 1) {
        n >>= 1;
        result++;
    }
    return result;
}
int fastLog2(uint32_t n) {
    return 31 - __builtin_clz(n);
}
void fastAlphaBlend(uint8_t* src, uint8_t* dest) {
    if (dest[3] == 0) {
        *(uint32_t*)dest = *(uint32_t*)src;
        return;
    }

    uint8_t alpha = src[3];
    if (alpha == 0) return;
    int inv = (255 - alpha);
    dest[0] = (src[0] * alpha + dest[0] * inv) >> 8;
    dest[1] = (src[1] * alpha + dest[1] * inv) >> 8;
    dest[2] = (src[2] * alpha + dest[2] * inv) >> 8;
    dest[3] = alpha + ((dest[3] * inv) >> 8);
}

uint32_t* valueColors = 0;
uint32_t* usageColors = 0;

void setColors(uint32_t* mValueColors, uint32_t* mUsageColors) {
    valueColors = mValueColors;
    usageColors = mUsageColors;
}
#define LAYER_IS_NOT_32 0
#define LAYER_ENDIAN_OFFSET 1
#define LAYER_MASK 2
#define LAYER_SHIFT_AMOUNT 3

int drawFlagBitmap(uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersPixelSizes, uint32_t* layersVisibleMasks, uint32_t* layersFlagColors,
    int originalWidth, int clipLeft, int clipTop, int clipRight, int clipBottom) {

    uint8_t blendedColor[4] = {0, 0, 0, 0};
    /*
        completeGroupInfo
        Index info - [0] == 1 not 32 bit per map pixel 
                     [1] == endianOffset
                     [2] == mask
                     [3] == shiftAmount
    */
    uint32_t layersGroupInfo[6][4] = { // in game 2 layers
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0},
        {0, 0, 0, 0}
        };


    for (int i = 0; i < layersCount; i++) {
        uint32_t bitPerPixel = layersPixelSizes[i];
        if (bitPerPixel == 32) continue;
        layersGroupInfo[i][LAYER_IS_NOT_32] = 1;
        layersGroupInfo[i][LAYER_ENDIAN_OFFSET] = 32 - bitPerPixel;
        layersGroupInfo[i][LAYER_MASK] = (1 << bitPerPixel) - 1;
        layersGroupInfo[i][LAYER_SHIFT_AMOUNT] = fastLog2(bitPerPixel);
    }


 
    uint32_t invHeight = originalWidth - 1;
    uint32_t bit = 0;

    uint32_t value = 0;



    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalWidth;
        int invertLine = y * originalWidth;

        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;


            blendedColor[0] = 0;
            blendedColor[1] = 0;
            blendedColor[2] = 0;
            blendedColor[3] = 0;
            for (int l = 0; l < layersCount; l++){
                if (layersGroupInfo[l][LAYER_IS_NOT_32]){
                    uint32_t* lg = layersGroupInfo[l];
                    uint32_t bitPosition = index << lg[LAYER_SHIFT_AMOUNT];
                    value = (((uint32_t*)layers[l])[bitPosition >> 5] >> (lg[LAYER_ENDIAN_OFFSET] - (bitPosition % 32))) & lg[LAYER_MASK];
                }else{
                    value = ((uint32_t*)layers[l])[index];
                }
                uint32_t visibleFlagsMask = layersVisibleMasks[l];
                uint32_t* layerColors = (uint32_t*)layersFlagColors[l];

             
                if (value != 0 && (value & visibleFlagsMask) != 0) {

                    for (int flag = 0; flag < layersPixelSizes[l]; flag++) {
                        bit = 1 << flag;
                        if ((value & bit) && (visibleFlagsMask & bit)) {
                            fastAlphaBlend((uint8_t*)&layerColors[flag % 32], blendedColor);
                        }
                    }
                }
            }

            *((uint32_t*)(output + ((invertLine + x) << 2))) = *((uint32_t*)blendedColor);
        }
    }
    return 0;
}


int printAreaFlagsToBitmap(uint8_t* bitmap, uint32_t* mValuesData, uint32_t* mUsageData, uint32_t valueFlagsMask, uint32_t usageFlagsMask, int wSize, int valueBitLength, int clipLeft, int clipTop, int clipRight, int clipBottom) {
    uint8_t blendedColor[4] = {0, 0, 0, 0};

    uint32_t bit = 0;
    uint32_t endianOffset = 32 - valueBitLength;
    uint32_t mask = (1 << valueBitLength) - 1;
    uint32_t invWSize = wSize - 1;
    uint32_t shiftAmount = fastLog2(valueBitLength);

	//drawFilledCircle(2048,2048,102,mValuesData,wSize,wSize,4,2,0);

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invWSize - y) * wSize;
        int invertLine = y * wSize;

        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            uint32_t usageFlags = mUsageData[index];
            uint32_t bitPosition = index << shiftAmount;  //  * valueBitLength;
            uint32_t valueFlags = (mValuesData[bitPosition >> 5] >> (endianOffset - (bitPosition % 32))) & mask;

//             if (usageFlags == 0 && valueFlags == 0) continue;
            blendedColor[0] = 0;
            blendedColor[1] = 0;
            blendedColor[2] = 0;
            blendedColor[3] = 0;

            if (usageFlags != 0 && (usageFlags & usageFlagsMask) != 0) {

                for (int flag = 0; flag < 17; flag++) {
                    bit = 1 << flag;
                    if ((usageFlags & bit) && (usageFlagsMask & bit)) {
                        fastAlphaBlend((uint8_t*)&usageColors[flag % 15], blendedColor);
                    }
                }
            }

            if (valueFlags != 0 && (valueFlags & valueFlagsMask)) {
                for (int flag = 0; flag < 6; flag++) {
                    bit = 1 << flag;
                    if ((valueFlags & bit) && (valueFlagsMask & bit)) {
                        fastAlphaBlend((uint8_t*)&valueColors[flag % 5], blendedColor);
                    }
                }
            }

            *((uint32_t*)(bitmap + ((invertLine + x) << 2))) = *((uint32_t*)blendedColor);
        }
    }
    return 0;
}


void clearPixel(int x, int y, uint32_t* mBuffer, int width, int height, int pixelBitLength, uint32_t setBit,int line,int endianOffset,int shiftAmount,uint32_t mask) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
        uint32_t bitPosition = (line + x) << shiftAmount;
        mBuffer[bitPosition >> 5] &= ~(setBit << (endianOffset - (bitPosition % 32))) ;
    }
}
void drawPixel(int x, int y, uint32_t* mBuffer, int width, int height, int pixelBitLength, uint32_t setBit,int line,int endianOffset,int shiftAmount) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
        uint32_t bitPosition = (line + x) << shiftAmount;  //  * valueBitLength;
        mBuffer[bitPosition >> 5] |= (setBit <<  (endianOffset - (bitPosition % 32)));
    }
}

void clearHorizontalLine(int x1, int x2, int y, uint32_t* mBuffer, int width, int height, int pixelBitLength, uint32_t setBit,int endianOffset,int shiftAmount,uint32_t mask) {
    int line = (width - y - 1) * width;
    for (int x = x1; x <= x2; x++) {
        clearPixel(x, y, mBuffer, width, height, pixelBitLength, setBit,line,endianOffset,shiftAmount,mask);
    }
}



void drawHorizontalLine(int x1, int x2, int y, uint32_t* mBuffer, int width, int height, int pixelBitLength, uint32_t setBit,int endianOffset,int shiftAmount) {
    int line = (width - y - 1) * width;
    for (int x = x1; x <= x2; x++) {
        drawPixel(x, y, mBuffer, width, height, pixelBitLength, setBit,line,endianOffset,shiftAmount);
    }
}

void drawFilledCircle(int xc, int yc, int radius, uint32_t* mBuffer, int width, int height, int pixelBitLength, uint32_t setBit,uint32_t drawMode) {
    int x = 0;
    int y = radius;
    int d = 3 - 2 * radius;
    int endianOffset = 32 - pixelBitLength;
    int shiftAmount = fastLog2(pixelBitLength);

    uint32_t mask = (1 << pixelBitLength) - 1;

    if (drawMode == 1){ // Можно сделать ссылку на функцию, но впадлу мне, 100 байт не проблема
        while (y >= x) {
            drawHorizontalLine(xc - x, xc + x, yc + y, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount);
            drawHorizontalLine(xc - x, xc + x, yc - y, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount);
            drawHorizontalLine(xc - y, xc + y, yc + x, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount);
            drawHorizontalLine(xc - y, xc + y, yc - x, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount);

            x++;

            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }

    }else{
       while (y >= x) {
            clearHorizontalLine(xc - x, xc + x, yc + y, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount,mask);
            clearHorizontalLine(xc - x, xc + x, yc - y, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount,mask);
            clearHorizontalLine(xc - y, xc + y, yc + x, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount,mask);
            clearHorizontalLine(xc - y, xc + y, yc - x, mBuffer, width, height, pixelBitLength, setBit,endianOffset,shiftAmount,mask);

            x++;

            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }
    }
}