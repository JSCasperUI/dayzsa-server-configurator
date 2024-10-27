/*
    Create by syxme 24.10.2024

    install https://emscripten.org/docs/getting_started/downloads.html
.\emsdk\upstream\emscripten\emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1

    emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_printAreaFlagsToBitmap","_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1
*/

#include <stdint.h>

int fastLog2(uint32_t n) {
    return 31 - __builtin_clz(n);
}

// #include <wasm_simd128.h>
//
// void fastAlphaBlendR_SIMD(uint32_t* src, uint32_t* dest) {
//     // Маски для выделения альфа, красного, зеленого и синего каналов
//     v128_t maskAlpha = wasm_i32x4_splat(0xFF000000);
//     v128_t maskRed   = wasm_i32x4_splat(0x00FF0000);
//     v128_t maskGreen = wasm_i32x4_splat(0x0000FF00);
//     v128_t maskBlue  = wasm_i32x4_splat(0x000000FF);
//
//     // Загружаем 4 пикселя из src и dest
//     v128_t srcPixels = wasm_v128_load(src);
//     v128_t destPixels = wasm_v128_load(dest);
//
//     // Извлечение альфа каналов для всех пикселей
//     v128_t srcAlpha = wasm_v128_and(srcPixels, maskAlpha); // alpha src
//     srcAlpha = wasm_u32x4_shr(srcAlpha, 24);         // сместить альфа-каналы на младшие биты
//
//     // Инвертируем альфа для смешивания
//     v128_t invAlpha = wasm_i32x4_sub(wasm_i32x4_splat(255), srcAlpha);
//
//     // Извлечение цветовых каналов (Red, Green, Blue) для src и dest
//     v128_t srcR = wasm_v128_and(srcPixels, maskRed);
//     v128_t srcG = wasm_v128_and(srcPixels, maskGreen);
//     v128_t srcB = wasm_v128_and(srcPixels, maskBlue);
//
//     v128_t destR = wasm_v128_and(destPixels, maskRed);
//     v128_t destG = wasm_v128_and(destPixels, maskGreen);
//     v128_t destB = wasm_v128_and(destPixels, maskBlue);
//
//     // Умножаем цветовые каналы на альфа и инвертированную альфа
//     srcR = wasm_i32x4_mul(srcR, srcAlpha);
//     srcG = wasm_i32x4_mul(srcG, srcAlpha);
//     srcB = wasm_i32x4_mul(srcB, srcAlpha);
//
//     destR = wasm_i32x4_mul(destR, invAlpha);
//     destG = wasm_i32x4_mul(destG, invAlpha);
//     destB = wasm_i32x4_mul(destB, invAlpha);
//
//     // Суммируем каналы и смещаем их для нормализации
//     v128_t outR = wasm_i32x4_add(srcR, destR);
//     v128_t outG = wasm_i32x4_add(srcG, destG);
//     v128_t outB = wasm_i32x4_add(srcB, destB);
//
//     outR = wasm_u32x4_shr(outR, 8);
//     outG = wasm_u32x4_shr(outG, 8);
//     outB = wasm_u32x4_shr(outB, 8);
//
//     // Маскируем и собираем обратно результат
//     outR = wasm_v128_and(outR, maskRed);
//     outG = wasm_v128_and(outG, maskGreen);
//     outB = wasm_v128_and(outB, maskBlue);
//
//     // Объединяем обратно все каналы
//     v128_t result = wasm_v128_or(outR, wasm_v128_or(outG, outB));
//
//     // Альфа-канал для результата
//     v128_t destAlpha = wasm_v128_and(destPixels, maskAlpha);
//     destAlpha = wasm_u32x4_shr(destAlpha, 24);
//     v128_t outAlpha = wasm_i32x4_add(srcAlpha, wasm_i32x4_mul(destAlpha, invAlpha));
//     outAlpha = wasm_u32x4_shr(outAlpha, 8);  // Нормализуем альфа
//     outAlpha = wasm_u32x4_shl(outAlpha, 24); // Возвращаем альфа на исходное место
//     result = wasm_v128_or(result, outAlpha);
//
//     // Сохраняем результат обратно в dest
//     wasm_v128_store(dest, result);
// }


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
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define CLAMP(n, lower, upper) (MAX(lower, MIN(n, upper)))



//120 ms

int drawFlagBitmapStatic2(
    uint8_t* output,uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,int originalWidth,int originalHeight, int clipLeft, int clipTop, int clipRight, int clipBottom){
    uint32_t blendedColor2 = 0;


    int l0                  = layersDepths[0]!=32;
    uint32_t* l0_data       = (uint32_t*)(layers[0]);
    int l0_endian_offset    = 32 - layersDepths[0];
    int l0_mask             = 32 - (1 << layersDepths[0]) - 1;
    if (!l0){
        l0_mask = 0xFFFFFFFF;
    }
    int l0_shiftAmount      = fastLog2(layersDepths[0]);
    uint32_t* l0_colors     = (uint32_t*)layersFlagColors[0];
    int l0_visible          = layersVisibleMasks[0];
    int l0_maxCount         = maxCount[0];


    int l1                  = layersDepths[1]!=32;
    uint32_t* l1_data       = (uint32_t*)(layers[1]);
    int l1_endian_offset    = 32 - layersDepths[1];
    int l1_mask             = 32 - (1 << layersDepths[1]) - 1;
    int l1_shiftAmount      = fastLog2(layersDepths[1]);
    uint32_t* l1_colors     = (uint32_t*)layersFlagColors[1];
    int l1_visible          = layersVisibleMasks[1];
    int l1_maxCount         = maxCount[1];



    uint32_t bit = 0;

    uint32_t value0 = 0;
    uint32_t value1 = 0;



    uint32_t bit0 = 0;
    uint32_t bit1 = 0;
    uint32_t bit2 = 0;
    uint32_t bit3 = 0;




    uint32_t l0_end_mask = l0_mask & l0_visible;
    uint32_t l1_end_mask = l1_mask & l1_visible;
    uint32_t invHeight = originalHeight - 1;

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalHeight;
        int invertLine = y * originalHeight;
        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            blendedColor2 = 0;
            value0 = l0_data[index] & l0_end_mask;
            uint32_t bitPosition = index << l1_shiftAmount;
            value1 = l1_data[bitPosition >> 5] >> (l1_endian_offset - (bitPosition % 32)) & l1_end_mask;

            if (value0) {
                for (int flag = 0; flag < l0_maxCount ; flag += 4) { //- 206
                    bit0 = 1 << flag;
                    bit1 = 1 << (flag + 1);
                    bit2 = 1 << (flag + 2);
                    bit3 = 1 << (flag + 3);

                    if ((value0 & bit0)) {
                         blendedColor2 = fastAlphaBlendR(l0_colors[flag],blendedColor2);
                    }
                    if ((value0 & bit1)) {
                        blendedColor2 = fastAlphaBlendR(l0_colors[flag+1],blendedColor2);
                    }
                    if ((value0 & bit2)) {
                        blendedColor2 = fastAlphaBlendR(l0_colors[flag+2],blendedColor2);
                    }
                    if ((value0 & bit3)) {
                        blendedColor2 = fastAlphaBlendR(l0_colors[flag+3],blendedColor2);
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
                        blendedColor2 = fastAlphaBlendR(l1_colors[flag],blendedColor2);
                    }
                    if (value1 & bit1) {
                        blendedColor2 = fastAlphaBlendR(l1_colors[flag+1],blendedColor2);
                    }
                    if (value1 & bit2) {
                        blendedColor2 = fastAlphaBlendR(l1_colors[flag+2],blendedColor2);
                    }
                    if (value1 & bit3) {
                        blendedColor2 = fastAlphaBlendR(l1_colors[flag+3],blendedColor2);
                    }
                }

            }


            // *((uint32_t*)(output + ((invertLine + x) << 2))) = *((uint32_t*)blendedColor);

           *((uint32_t*)(output + ((invertLine + x) << 2))) = blendedColor2;
        }
    }
    return 0;
}


int drawFlagBitmap(
    uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,
    int originalWidth,int originalHeight, int clipLeft, int clipTop, int clipRight, int clipBottom) {


    if (layersCount ==2){
        return drawFlagBitmapStatic2(output,layers,layersCount,layersDepths,layersVisibleMasks,maxCount,layersFlagColors,originalWidth,originalHeight, clipLeft, clipTop, clipRight,  clipBottom);
    }
    uint32_t blendedColor2 = 0;
    /*
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

    uint32_t isNot32Bitset = 0;
    for (int i = 0; i < layersCount; i++) {
        uint32_t bitPerPixel = layersDepths[i];
        if (bitPerPixel == 32) continue;
        isNot32Bitset |= 1 << i;

        layersGroupInfo[i][LAYER_ENDIAN_OFFSET] = 32 - bitPerPixel;
        layersGroupInfo[i][LAYER_MASK] = ((1 << bitPerPixel) - 1) & layersVisibleMasks[i];
        layersGroupInfo[i][LAYER_SHIFT_AMOUNT] = fastLog2(bitPerPixel);
    }

    uint32_t invHeight = originalHeight - 1;
    uint32_t bit = 0;

    uint32_t value = 0;

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalHeight;
        int invertLine = y * originalHeight;

        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            blendedColor2 = 0;

            for (int l = 0; l < layersCount; l++){

                uint32_t visibleFlagsMask = layersVisibleMasks[l];
                if ((isNot32Bitset & (1 << l))){
                    uint32_t* lg = layersGroupInfo[l];
                    uint32_t bitPosition = index << lg[LAYER_SHIFT_AMOUNT];
                    value = (((uint32_t*)layers[l])[bitPosition >> 5] >> (lg[LAYER_ENDIAN_OFFSET] - (bitPosition % 32))) & lg[LAYER_MASK];
                }else{
                    value = (((uint32_t*)layers[l])[index]) & visibleFlagsMask;
                }
          
                uint32_t* layerColors = (uint32_t*)layersFlagColors[l];

             
                if (value) {
                    for (int flag = 0; flag < maxCount[l] ; flag += 4) { //- 206
                        uint32_t bit0 = 1 << flag;
                        uint32_t bit1 = 1 << (flag + 1);
                        uint32_t bit2 = 1 << (flag + 2);
                        uint32_t bit3 = 1 << (flag + 3);

                        if ((value & bit0)) {
                            blendedColor2 = fastAlphaBlendR(layerColors[flag],blendedColor2);
                        }
                        if ((value & bit1) ) {
                            blendedColor2 = fastAlphaBlendR(layerColors[flag+1],blendedColor2);
                        }
                        if ((value & bit2)) {
                            blendedColor2 = fastAlphaBlendR(layerColors[flag+2],blendedColor2);
                        }
                        if ((value & bit3)) {
                            blendedColor2 = fastAlphaBlendR(layerColors[flag+3],blendedColor2);
                        }
                    }
                }
            }

            *((uint32_t*)(output + ((invertLine + x) << 2))) = blendedColor2;
        }
    }
    return 0;
}

void clearHorizontalLine(int x1, int x2, int y, uint32_t* mBuffer, int width, int height, int depth, uint32_t setBit,int endianOffset,int shiftAmount) {
    int line = (height - y - 1) * height;
   x1 = CLAMP(x1, 0, width - 1);
    x2 = CLAMP(x2, 0, width - 1);
    y = CLAMP(y, 0, height - 1);
    for (int x = x1; x <= x2; x++) {
            uint32_t bitPosition = (line + x) << shiftAmount;
            mBuffer[bitPosition >> 5] &= ~(setBit << (endianOffset - (bitPosition % 32))) ;
        // clearPixel(x, y, mBuffer, width, height, depth, setBit,line,endianOffset,shiftAmount);
    }
}


void drawHorizontalLine(int x1, int x2, int y, uint32_t* mBuffer, int width, int height, int depth, uint32_t setBit,int endianOffset,int shiftAmount,uint32_t drawMode) {
   
    x1 = CLAMP(x1, 0, width);
    x2 = CLAMP(x2, 0, width);
    if (y>height-1 || y <0){
        return;
    }
    int line = (height - y - 1) * height;

    switch (drawMode){
    case 0:{ // стираем бит 
        for (int x = x1; x < x2; x++) {
            uint32_t bitPosition = (line + x) << shiftAmount; 
            mBuffer[bitPosition >> 5] &= ~(setBit << (endianOffset - (bitPosition % 32))) ;
        }
        break;
    }
    case 1:{//рисуем бит 
        for (int x = x1; x < x2; x++) {
            uint32_t bitPosition = (line + x) << shiftAmount;  
            mBuffer[bitPosition >> 5] |= (setBit <<  (endianOffset - (bitPosition % 32)));
        }
        break;
    }
     case 3:{ //рисуем бит и стираем другие
        for (int x = x1; x <x2; x++) {
            uint32_t bitPosition = (line + x) << shiftAmount; 
            uint32_t mask = (1 << depth) - 1;  
            uint32_t shift = (endianOffset - (bitPosition % 32));
            bitPosition >>=5;
            mBuffer[bitPosition] &= ~(mask << shift);
            mBuffer[bitPosition] |= (setBit << shift);
        }
        break;
    }
    default:
        break;
    }

}

void drawFilledCircle(int xc, int yc, int radius, uint32_t* mBuffer, int width, int height, int depth, uint32_t setBit,uint32_t drawMode) {
    int x = 0;
    int y = radius;
    int d = 3 - 2 * radius;
    int endianOffset = 32 - depth;
    int shiftAmount = fastLog2(depth);


        while (y >= x) {
            drawHorizontalLine(xc - x, xc + x, yc + y, mBuffer, width, height, depth, setBit,endianOffset,shiftAmount,drawMode);
            drawHorizontalLine(xc - x, xc + x, yc - y, mBuffer, width, height, depth, setBit,endianOffset,shiftAmount,drawMode);
            drawHorizontalLine(xc - y, xc + y, yc + x, mBuffer, width, height, depth, setBit,endianOffset,shiftAmount,drawMode);
            drawHorizontalLine(xc - y, xc + y, yc - x, mBuffer, width, height, depth, setBit,endianOffset,shiftAmount,drawMode);

            x++;

            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }


}