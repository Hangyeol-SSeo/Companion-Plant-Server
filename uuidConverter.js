const { v4: uuidv4 } = require('uuid');

function uuidToBytes(uuid) {
    const parts = [
        parseInt(uuid.slice(0, 8), 16),
        parseInt(uuid.slice(9, 13), 16),
        parseInt(uuid.slice(14, 18), 16),
        parseInt(uuid.slice(19, 23), 16),
        parseInt(uuid.slice(24, 36), 16)
    ];

    const bytes = Buffer.alloc(16);
    bytes.writeUInt32BE(parts[0], 0);
    bytes.writeUInt16BE(parts[1], 4);
    bytes.writeUInt16BE(parts[2], 6);
    bytes.writeUInt16BE(parts[3], 8);
    bytes.writeUInt32BE(Math.floor(parts[4] / 0x10000), 10);
    bytes.writeUInt16BE(parts[4] & 0xFFFF, 14);
    return bytes;
}

function bytesToUUID(bytes) {
    const parts = [
        bytes.readUInt32BE(0).toString(16),
        bytes.readUInt16BE(4).toString(16),
        bytes.readUInt16BE(6).toString(16),
        bytes.readUInt16BE(8).toString(16),
        (bytes.readUInt32BE(10) * 0x10000 + bytes.readUInt16BE(14)).toString(16)
    ];

    return `${parts[0].padStart(8, '0')}-${parts[1].padStart(4, '0')}-${parts[2].padStart(4, '0')}-${parts[3].padStart(4, '0')}-${parts[4].padStart(12, '0')}`;
}

module.exports = {uuidToBytes, bytesToUUID};

// Test
// const originalUUID = uuidv4();
// console.log("Original UUID:", originalUUID);
//
// const uuidBytes = uuidToBytes(originalUUID);
// console.log("Bytes Length:", uuidBytes);
//
// const convertedUUID = bytesToUUID(uuidBytes);
// console.log("Converted UUID:", convertedUUID);
