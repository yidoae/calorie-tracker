import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { PHOTO_QUALITY, resizeTarget } from "./photoLogic";

export interface Photo {
  uri: string;
  base64: string;
}

export type PhotoSource = "camera" | "library";

/**
 * Takes or picks one photo and shrinks it on the phone (003 FR-001, FR-002). The original is never
 * sent or kept; `denied` is set when the user refused the permission.
 */
export function usePhoto() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [denied, setDenied] = useState<PhotoSource | null>(null);

  async function choose(source: PhotoSource) {
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setDenied(source);
      return;
    }
    setDenied(null);
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
    const picked = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;
    const context = ImageManipulator.manipulate(asset.uri);
    const target = resizeTarget(asset.width, asset.height);
    if (target) context.resize(target);
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY, base64: true });
    if (saved.base64) setPhoto({ uri: saved.uri, base64: saved.base64 });
  }

  return { photo, denied, choose, clear: () => setPhoto(null) };
}
