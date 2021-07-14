import { onnx } from "onnx-proto";
import { inflate } from "pako";
import { DataArrayTypes } from "../../interface/core/constants";

const decodeTable = [
  0.0, 2.750000021e-6, 7.249999726e-6, 1.875000089e-5, 3.624999954e-5,
  5.874999624e-5, 8.624999464e-5, 1.437500032e-4, 2.312500001e-4,
  3.187500115e-4, 4.062500084e-4, 5.187499919e-4, 6.562499912e-4,
  7.937499322e-4, 9.312499315e-4, 1.218750025e-3, 1.65624998e-3, 2.093750052e-3,
  2.531250007e-3, 2.968749963e-3, 3.406249918e-3, 3.843750106e-3,
  4.281249829e-3, 4.843750037e-3, 5.531250034e-3, 6.218749564e-3, 6.90624956e-3,
  7.593749557e-3, 8.281249553e-3, 8.968749084e-3, 9.656248614e-3,
  1.109374966e-2, 1.328125037e-2, 1.546875015e-2, 1.765624993e-2, 1.98437497e-2,
  2.203124948e-2, 2.421874925e-2, 2.640625089e-2, 2.859375067e-2,
  3.078125045e-2, 3.296874836e-2, 3.515625e-2, 3.734375164e-2, 3.953124955e-2,
  4.171875119e-2, 4.390624911e-2, 4.671875015e-2, 5.01562506e-2, 5.359374732e-2,
  5.703124776e-2, 6.046874821e-2, 6.390624493e-2, 6.734374911e-2,
  7.078124583e-2, 7.421874255e-2, 7.765624672e-2, 8.109374344e-2,
  8.453124017e-2, 8.796874434e-2, 9.140624106e-2, 9.484373778e-2,
  9.828124195e-2, 1.0546875e-1, 1.16406247e-1, 1.27343744e-1, 1.38281256e-1,
  1.49218753e-1, 1.6015625e-1, 1.71093747e-1, 1.82031244e-1, 1.92968756e-1,
  2.03906253e-1, 2.1484375e-1, 2.25781247e-1, 2.36718744e-1, 2.47656256e-1,
  2.585937381e-1, 2.6953125e-1, 2.804687619e-1, 2.91406244e-1, 3.02343756e-1,
  3.132812381e-1, 3.2421875e-1, 3.351562619e-1, 3.46093744e-1, 3.57031256e-1,
  3.679687381e-1, 3.7890625e-1, 3.898437619e-1, 4.00781244e-1, 4.11718756e-1,
  4.226562381e-1, 4.3359375e-1, 4.445312619e-1, 4.58593756e-1, 4.757812321e-1,
  4.929687381e-1, 5.101562142e-1, 5.2734375e-1, 5.445312262e-1, 5.617187023e-1,
  5.789062381e-1, 5.960937142e-1, 6.1328125e-1, 6.304687262e-1, 6.476562023e-1,
  6.648437381e-1, 6.820312142e-1, 6.992186904e-1, 7.164062262e-1,
  7.335937023e-1, 7.507811785e-1, 7.679687142e-1, 7.851561904e-1,
  8.023436666e-1, 8.195312023e-1, 8.367186785e-1, 8.539061546e-1,
  8.710936904e-1, 8.882811666e-1, 9.054686427e-1, 9.226561785e-1,
  9.398436546e-1, 9.570311308e-1, 9.742186666e-1, 9.914061427e-1, 1.0,
];

export function decodeTensorEightbit(
  buf: ArrayBuffer,
  bodyByteOffset: number,
  bodyCompressedLength: number,
  dataType: number,
  numel: number
): DataArrayTypes {
  if (dataType !== onnx.TensorProto.DataType.FLOAT) {
    throw new Error("Unsupported DataType");
  }
  const view = new DataView(buf, bodyByteOffset, bodyCompressedLength),
    codeByteLength = view.getUint32(0, true),
    scale = view.getFloat32(4, true),
    decompressed = inflate(
      new Uint8Array(buf, bodyByteOffset + 8, codeByteLength)
    ),
    scaledTable = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    scaledTable[i] = decodeTable[i & 0x7f] * scale * (i < 128 ? 1.0 : -1.0);
  }
  const data = new Float32Array(numel);
  for (let i = 0; i < numel; i++) {
    data[i] = scaledTable[decompressed[i]];
  }
  return data;
}