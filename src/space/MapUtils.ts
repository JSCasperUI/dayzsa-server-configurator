

export function cordToTile(coordinate:number, z:number, length:number):number {
    return Math.floor((coordinate / length) * (1 << z));
}