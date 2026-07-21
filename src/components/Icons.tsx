import { Check, X, Warning, HandWaving, Confetti, UploadSimple, FileText, Eye, DownloadSimple, ArrowsClockwise, Package, Star } from '@phosphor-icons/react';

type IconProps = { size?: number; color?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' };

export function IconCheck(props: IconProps) { return <Check {...props} />; }
export function IconX(props: IconProps) { return <X {...props} />; }
export function IconWarning(props: IconProps) { return <Warning {...props} />; }
export function IconHandWaving(props: IconProps) { return <HandWaving {...props} />; }
export function IconConfetti(props: IconProps) { return <Confetti {...props} />; }
export function IconUploadSimple(props: IconProps) { return <UploadSimple {...props} />; }
export function IconFileText(props: IconProps) { return <FileText {...props} />; }
export function IconEye(props: IconProps) { return <Eye {...props} />; }
export function IconDownloadSimple(props: IconProps) { return <DownloadSimple {...props} />; }
export function IconArrowsClockwise(props: IconProps) { return <ArrowsClockwise {...props} />; }
export function IconPackage(props: IconProps) { return <Package {...props} />; }
export function IconStar(props: IconProps) { return <Star {...props} />; }
