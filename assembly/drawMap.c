/*
    Create by syxme 24.10.2024

    install https://emscripten.org/docs/getting_started/downloads.html

    emcc ./assembly/drawMap.c -O3 -o ./res/wasms/drawMap.wasm -s WASM=1 -s EXPORTED_FUNCTIONS='["_printAreaFlagsToBitmap","_setColors","_drawFlagBitmap","_drawFilledCircle"]' --no-entry -s IMPORTED_MEMORY=1 -s ALLOW_MEMORY_GROWTH=1
*/

#include <stdint.h>
#include <pthread.h>


int drawFlagBitmap(
    uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,
    int originalWidth, int clipLeft, int clipTop, int clipRight, int clipBottom) ;
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
void fastAlphaBlendV(uint32_t src, uint32_t* dest) {
    // Если dest полностью прозрачен (альфа = 0), просто копируем src
    if (((*dest >> 24) & 0xFF) == 0) {
        *dest = src;
        return;
    }

    uint8_t alpha = (src >> 24) & 0xFF;

    if (alpha == 0) return;

    int invAlpha = 255 - alpha;

    // Извлекаем цветовые компоненты src и dest
    uint8_t srcR = (src >> 16) & 0xFF;
    uint8_t srcG = (src >> 8) & 0xFF;
    uint8_t srcB = src & 0xFF;

    uint8_t destR = (*dest >> 16) & 0xFF;
    uint8_t destG = (*dest >> 8) & 0xFF;
    uint8_t destB = *dest & 0xFF;
    uint8_t destA = (*dest >> 24) & 0xFF;

    // Выполняем альфа-смешивание для каждого канала
    uint8_t outR = (srcR * alpha + destR * invAlpha) >> 8;
    uint8_t outG = (srcG * alpha + destG * invAlpha) >> 8;
    uint8_t outB = (srcB * alpha + destB * invAlpha) >> 8;
    uint8_t outA = alpha + ((destA * invAlpha) >> 8);

    // Записываем финальный цвет обратно в dest
    *dest = (outA << 24) | (outR << 16) | (outG << 8) | outB;
}
uint32_t fastAlphaBlendR(uint32_t src, uint32_t dest) {

    
    // Если dest полностью прозрачен (альфа = 0), просто копируем src
    if (((dest >> 24) & 0xFF) == 0) {
        return src;
    }
    uint8_t alpha = (src >> 24);

    if (alpha == 0) return dest;

    int invAlpha = 255 - alpha;

    // Извлекаем цветовые компоненты src и dest
    uint8_t srcR = (src >> 16) & 0xFF;
    uint8_t srcG = (src >> 8) & 0xFF;
    uint8_t srcB = src & 0xFF;

    uint8_t destR = (dest >> 16) & 0xFF;
    uint8_t destG = (dest >> 8) & 0xFF;
    uint8_t destB = dest & 0xFF;
    uint8_t destA = (dest >> 24);

    // Выполняем альфа-смешивание для каждого канала
    uint8_t outR = (srcR * alpha + destR * invAlpha) >> 8;
    uint8_t outG = (srcG * alpha + destG * invAlpha) >> 8;
    uint8_t outB = (srcB * alpha + destB * invAlpha) >> 8;
    uint8_t outA = alpha + ((destA * invAlpha) >> 8);

    // Возвращаем финальный цвет в формате uint32_t
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
typedef struct {
    uint8_t* output;
    uint32_t* layers;
    int layersCount;
    uint32_t* layersDepths;
    uint32_t* layersVisibleMasks;
    uint32_t* maxCount;
    uint32_t* layersFlagColors;
    int originalWidth;
    int clipLeft;
    int clipTop;
    int clipRight;
    int clipBottom;
} thread_data;

void* drawFlagBitmapThread(void* arg) {
    thread_data* data = (thread_data*)arg;
    // Вызов функции drawFlagBitmap для каждой области
    drawFlagBitmap(data->output, data->layers, data->layersCount, data->layersDepths, data->layersVisibleMasks, data->maxCount, data->layersFlagColors, data->originalWidth, data->clipLeft, data->clipTop, data->clipRight, data->clipBottom);
    return NULL;
}


//120 ms

int drawFlagBitmapStatic2(
    uint8_t* output,uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,int originalWidth, int clipLeft, int clipTop, int clipRight, int clipBottom){
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



    uint32_t invHeight = originalWidth - 1;
    uint32_t bit = 0;

    uint32_t value0 = 0;
    uint32_t value1 = 0;



    uint32_t bit0 = 0;
    uint32_t bit1 = 0;
    uint32_t bit2 = 0;
    uint32_t bit3 = 0;




    uint32_t l0_end_mask = l0_mask & l0_visible;
    uint32_t l1_end_mask = l1_mask & l1_visible;
    
    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalWidth;
        int invertLine = y * originalWidth;
        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            blendedColor2 = 0;
                value0 = l0_data[index] & l0_end_mask;
                uint32_t bitPosition = index << l1_shiftAmount;
                value1 = l1_data[bitPosition >> 5] >> (l1_endian_offset - (bitPosition & 31)) & l1_end_mask;

            if (value0 ) {
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


int drawFlagBitmapT(
    uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,
    int originalWidth, int clipLeft, int clipTop, int clipRight, int clipBottom) {

    // Вычисление площади
    int width = clipRight - clipLeft;
    int height = clipBottom - clipTop;
    int area = width * height;

    // Если площадь меньше 500 квадратных пикселей, просто обрабатываем область без деления
    if (area <= 500) {
        drawFlagBitmap(output, layers, layersCount, layersDepths, layersVisibleMasks, maxCount, layersFlagColors, originalWidth, clipLeft, clipTop, clipRight, clipBottom);
        return 0;
    }

    // Иначе делим область на 4 части и обрабатываем каждую в отдельном потоке
    pthread_t threads[4];
    thread_data threadData[4];

    int midX = (clipLeft + clipRight) / 2;
    int midY = (clipTop + clipBottom) / 2;

    // Верхний левый угол
    threadData[0] = (thread_data){ output, layers, layersCount, layersDepths, layersVisibleMasks, maxCount, layersFlagColors, originalWidth, clipLeft, clipTop, midX, midY };
    pthread_create(&threads[0], NULL, drawFlagBitmapThread, &threadData[0]);

    // Верхний правый угол
    threadData[1] = (thread_data){ output, layers, layersCount, layersDepths, layersVisibleMasks, maxCount, layersFlagColors, originalWidth, midX, clipTop, clipRight, midY };
    pthread_create(&threads[1], NULL, drawFlagBitmapThread, &threadData[1]);

    // Нижний левый угол
    threadData[2] = (thread_data){ output, layers, layersCount, layersDepths, layersVisibleMasks, maxCount, layersFlagColors, originalWidth, clipLeft, midY, midX, clipBottom };
    pthread_create(&threads[2], NULL, drawFlagBitmapThread, &threadData[2]);

    // Нижний правый угол
    threadData[3] = (thread_data){ output, layers, layersCount, layersDepths, layersVisibleMasks, maxCount, layersFlagColors, originalWidth, midX, midY, clipRight, clipBottom };
    pthread_create(&threads[3], NULL, drawFlagBitmapThread, &threadData[3]);

    // Ожидаем завершения всех потоков
    for (int i = 0; i < 4; i++) {
        pthread_join(threads[i], NULL);
    }

    return 0;
}

int drawFlagBitmap(
    uint8_t* output,
    uint32_t* layers, int layersCount, uint32_t* layersDepths, uint32_t* layersVisibleMasks, uint32_t* maxCount, uint32_t* layersFlagColors,
    int originalWidth, int clipLeft, int clipTop, int clipRight, int clipBottom) {


if (layersCount ==2){
    return drawFlagBitmapStatic2(output,layers,layersCount,layersDepths,layersVisibleMasks,maxCount,layersFlagColors,originalWidth, clipLeft, clipTop, clipRight,  clipBottom);
}
    uint8_t blendedColor[4] = {0, 0, 0, 0};
    uint32_t blendedColor2 = 0;
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

    uint32_t isNot32Bitset = 0;
    for (int i = 0; i < layersCount; i++) {
        uint32_t bitPerPixel = layersDepths[i];
        if (bitPerPixel == 32) continue;
        isNot32Bitset |= 1 << i;

        layersGroupInfo[i][LAYER_ENDIAN_OFFSET] = 32 - bitPerPixel;
        layersGroupInfo[i][LAYER_MASK] = ((1 << bitPerPixel) - 1) & layersVisibleMasks[i];
        layersGroupInfo[i][LAYER_SHIFT_AMOUNT] = fastLog2(bitPerPixel);
    }

    uint32_t maxFlagCount[2] = {18,5};
    uint32_t invHeight = originalWidth - 1;
    uint32_t bit = 0;

    uint32_t value = 0;



    uint32_t packedFlags = (17 << 24) | (5 << 16) | (32 << 8) | 32;
    for (int y = clipTop; y < clipBottom; y++) {
        int line = (invHeight - y) * originalWidth;
        int invertLine = y * originalWidth;

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
         

                // for (int flag = 0; flag < ((packedFlags >> (8*l)) & 0xFF) ; flag += 4) { // 379
                    for (int flag = 0; flag < maxCount[l] ; flag += 4) { //- 206
                    // for (int flag = 0; flag < maxFlagCount[l] ; flag += 4) { //239
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


            // *((uint32_t*)(output + ((invertLine + x) << 2))) = *((uint32_t*)blendedColor);
            *((uint32_t*)(output + ((invertLine + x) << 2))) = blendedColor2;
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