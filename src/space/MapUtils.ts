

export function cordToTile(coordinate:number, z:number, length:number):number {
    return ((coordinate / length) * (1 << z)) | 1;
}