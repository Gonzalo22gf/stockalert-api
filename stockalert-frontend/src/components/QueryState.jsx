import { SkeletonTabla } from "./Skeleton";

export default function QueryState({ isLoading, isError, errorMsg, skeletonFilas = 5, children }) {
  if (isLoading) return <SkeletonTabla filas={skeletonFilas} />;
  if (isError)   return <p className="text-sm text-red-400">{errorMsg || "No se pudieron cargar los datos."}</p>;
  return children;
}
