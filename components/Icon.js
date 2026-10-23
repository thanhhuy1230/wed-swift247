import {Plane,Truck,Package,Timer,Wallet,Boxes,Store,MousePointerClick,MapPinned,Headset,ShieldCheck,Zap,Clock,Gift,Smartphone,Globe,Ship,Star,Heart,Users,Rocket,FileText,Bike,Warehouse,PackageCheck,Building2,Briefcase,Container,Receipt,BadgePercent,ThumbsUp,DoorOpen,Home,MapPin,Route,Sparkles,Navigation} from 'lucide-react';
const M={Plane,Truck,Package,Timer,Wallet,Boxes,Store,MousePointerClick,MapPinned,Headset,ShieldCheck,Zap,Clock,Gift,Smartphone,Globe,Ship,Star,Heart,Users,Rocket,FileText,Bike,Warehouse,PackageCheck,Building2,Briefcase,Container,Receipt,BadgePercent,ThumbsUp,DoorOpen,Home,MapPin,Route,Sparkles,Navigation};
export const ICON_NAMES=Object.keys(M);
export default function Icon({name,...p}){const I=M[name]||Package;return <I {...p}/>}
