#include <stdint.h>

#define VALUE_FLAG_COLORS_LEN 5
#define USAGE_FLAG_COLORS_LEN 16

// Пример массивов цветов для valueFlags и usageFlags
const uint8_t VALUE_FLAG_COLORS[VALUE_FLAG_COLORS_LEN][4] = {
{178,235,255,120},{36,106,111,171},{83,49,255,143},{229,165,1,173},{243,255,0,153}
};

const uint8_t USAGE_FLAG_COLORS[USAGE_FLAG_COLORS_LEN][4] = {
   {197,0,0,148},
   {77,77,77,120},
   {83,160,168,156},
   {66,203,75,140},
   {207,34,152,128},
   {97,75,50,194},{28,103,168,179},{208,208,38,196},{190,147,62,207},{106,51,97,189},{101,197,186,204},{33,78,83,120},{55,95,239,100},{190,80,179,156},{224,255,69,115},{85,0,0,120}
};

#include <wasm_simd128.h>


void alphaBlendPreMultiplied(const uint8_t* src, uint8_t* dest) {

     uint8_t da = dest[3];
       if (da == 0) {
           dest[0] = src[0];
           dest[1] = src[1];
           dest[2] = src[2];
           dest[3] = src[3];
           return;
       }
       uint8_t sa = src[3];
       if (sa == 255) {
           dest[0] = src[0];
           dest[1] = src[1];
           dest[2] = src[2];
           dest[3] = src[3];
           return;
       }

    int rem = da * (255 - sa) >> 8;

    dest[0] = (src[0] * sa + dest[0] * rem) >> 8;
    dest[1] = (src[1] * sa + dest[1] * rem) >> 8;
    dest[2] = (src[2] * sa + dest[2] * rem) >> 8;
    dest[3] = sa + (rem >> 8);

// int inv_sa = 255 - sa;
//
//     // Выполняем альфа-смешивание без повторного умножения src на sa
//     dest[0] = src[0] + ((dest[0] * inv_sa) >> 8);
//     dest[1] = src[1] + ((dest[1] * inv_sa) >> 8);
//     dest[2] = src[2] + ((dest[2] * inv_sa) >> 8);
//     dest[3] = sa + ((da * inv_sa) >> 8);
}

// Основная функция
void printAreaFlagsToBitmap(uint8_t* bitmap, uint32_t* mValuesData, uint32_t* mUsageData, uint32_t valueFlagsMask, uint32_t usageFlagsMask, int wSize, int valueBitLength, int clipLeft, int clipTop, int clipRight, int clipBottom) {
    uint8_t blendedColor[4] = {0, 0, 0, 0};
    uint32_t pixelIndex = 0;
    uint32_t endianOffset = 32 - valueBitLength;
    uint32_t mask = (1 << valueBitLength) - 1;
    uint32_t invWSize = wSize-1;
    int bit = 0;

    for (int y = clipTop; y < clipBottom; y++) {
        int line = (wSize - y - 1 ) * wSize;
        int invertLine = y * wSize;

        for (int x = clipLeft; x < clipRight; x++) {
            uint32_t index = line + x;
            uint32_t usageFlags = mUsageData[index];
            uint64_t bitPosition = index * valueBitLength;
            uint32_t valueFlags = (mValuesData[bitPosition >> 5] >> (endianOffset - (bitPosition % 32))) & mask;
            if (usageFlags == 0 && valueFlags == 0) continue;

//             blendedColor[1] = 0;
//             blendedColor[2] = 0;
            blendedColor[3] = 0;
//             blendedColor[0] = 0;

            if ((valueFlags & valueFlagsMask) != 0 && valueFlags != 0) {
                for (int flag = 0; flag < 8; flag++) {
//                     bit = (1 << flag);
                    if ((valueFlags & (1 << flag))!=0) {
//                          blendedColor[3] = 255;
//                          blendedColor[0] = VALUE_FLAG_COLORS[flag ][0];
//                          blendedColor[1] = VALUE_FLAG_COLORS[flag ][1];
//                          blendedColor[2] = VALUE_FLAG_COLORS[flag ][2];
//                          blendedColor[1] = 20*flag;
                         alphaBlendPreMultiplied(VALUE_FLAG_COLORS[flag % 5], blendedColor);
                    }
                }
            }

            if (usageFlags != 0 && (usageFlags & usageFlagsMask) != 0) {
                for (int flag = 0; flag < 16; flag++) {
                    bit = (1 << flag);
                    if ( (usageFlags & (1 << flag))!=0) {
                         alphaBlendPreMultiplied(USAGE_FLAG_COLORS[flag % 15], blendedColor);
//                     blendedColor[3] = 255;

                    }
                }
            }

            pixelIndex = (invertLine + x) << 2;
            bitmap[pixelIndex] = blendedColor[0];
            bitmap[pixelIndex + 1] = blendedColor[1];
            bitmap[pixelIndex + 2] = blendedColor[2];
            bitmap[pixelIndex + 3] = blendedColor[3];
        }
    }
}
