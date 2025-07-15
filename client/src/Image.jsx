const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

export default function Image({ src, ...rest }) {
  src = src?.includes("https://") ? src : `${IMAGE_BASE_URL}/${src}`;
  return <img {...rest} src={src} alt="" />;
}
