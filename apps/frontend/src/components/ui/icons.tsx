import type { ForwardRefExoticComponent, ReactElement, Ref, RefAttributes, SVGProps } from 'react'
import { createElement, forwardRef } from 'react'
import * as Iconsax from 'iconsax-react'
import {
  ALargeSmall,
  Brain,
  Bug,
  Cookie,
  GripVertical,
  Heading2,
  Highlighter,
  List,
  Loader2,
  PartyPopper,
  Power,
  Strikethrough,
  Unlink,
  Webhook,
  WifiOff,
} from 'lucide-react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }
export type LucideIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

type IconsaxComponent = (typeof Iconsax)['ArrowLeft']

function bold(Component: IconsaxComponent, displayName: string): LucideIcon {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>(function IconsaxBold(
    { color, size, ...rest },
    ref: Ref<SVGSVGElement>
  ): ReactElement {
    return createElement(Component as never, {
      ref,
      variant: 'Bold',
      color: color ?? 'currentColor',
      size: size ?? 24,
      ...rest,
    })
  })
  Wrapped.displayName = displayName
  return Wrapped
}

export const Activity = bold(Iconsax.Activity, 'Activity')
export const AlertCircle = bold(Iconsax.InfoCircle, 'AlertCircle')
export const AlertTriangle = bold(Iconsax.Warning2, 'AlertTriangle')
export const Archive = bold(Iconsax.Archive, 'Archive')
export const ArchiveRestore = bold(Iconsax.Archive, 'ArchiveRestore')
export const ArrowLeft = bold(Iconsax.ArrowLeft, 'ArrowLeft')
export const ArrowRight = bold(Iconsax.ArrowRight, 'ArrowRight')
export const ArrowRightLeft = bold(Iconsax.ArrowSwapHorizontal, 'ArrowRightLeft')
export const ArrowUpRight = bold(Iconsax.ArrowRight2, 'ArrowUpRight')
export const Ban = bold(Iconsax.Forbidden, 'Ban')
export const Banknote = bold(Iconsax.Money, 'Banknote')
export const BarChart3 = bold(Iconsax.Chart, 'BarChart3')
export const Bell = bold(Iconsax.Notification, 'Bell')
export const Bold = bold(Iconsax.TextBold, 'Bold')
export const Briefcase = bold(Iconsax.Briefcase, 'Briefcase')
export const Building2 = bold(Iconsax.Buildings2, 'Building2')
export const Calendar = bold(Iconsax.Calendar, 'Calendar')
export const CalendarClock = bold(Iconsax.CalendarTick, 'CalendarClock')
export const CalendarDays = bold(Iconsax.Calendar, 'CalendarDays')
export const Camera = bold(Iconsax.Camera, 'Camera')
export const Check = bold(Iconsax.TickCircle, 'Check')
export const CheckCircle = bold(Iconsax.TickCircle, 'CheckCircle')
export const CheckCircle2 = bold(Iconsax.TickCircle, 'CheckCircle2')
export const ChevronDown = bold(Iconsax.ArrowDown2, 'ChevronDown')
export const ChevronLeft = bold(Iconsax.ArrowLeft2, 'ChevronLeft')
export const ChevronRight = bold(Iconsax.ArrowRight2, 'ChevronRight')
export const ChevronUp = bold(Iconsax.ArrowUp2, 'ChevronUp')
export const ChevronsUpDown = bold(Iconsax.ArrowSwapVertical, 'ChevronsUpDown')
export const CirclePlus = bold(Iconsax.AddCircle, 'CirclePlus')
export const ClipboardList = bold(Iconsax.ClipboardText, 'ClipboardList')
export const Clock = bold(Iconsax.Clock, 'Clock')
export const Cloud = bold(Iconsax.Cloud, 'Cloud')
export const Code2 = bold(Iconsax.Code, 'Code2')
export const Coins = bold(Iconsax.Coin, 'Coins')
export const Copy = bold(Iconsax.Copy, 'Copy')
export const CreditCard = bold(Iconsax.Card, 'CreditCard')
export const Crown = bold(Iconsax.Crown, 'Crown')
export const Database = bold(Iconsax.Data, 'Database')
export const DollarSign = bold(Iconsax.DollarCircle, 'DollarSign')
export const Download = bold(Iconsax.DocumentDownload, 'Download')
export const ExternalLink = bold(Iconsax.ExportSquare, 'ExternalLink')
export const Eye = bold(Iconsax.Eye, 'Eye')
export const EyeOff = bold(Iconsax.EyeSlash, 'EyeOff')
export const FileArchive = bold(Iconsax.Archive, 'FileArchive')
export const FileCheck = bold(Iconsax.DocumentText1, 'FileCheck')
export const FileEdit = bold(Iconsax.Edit2, 'FileEdit')
export const FileMinus2 = bold(Iconsax.DocumentText, 'FileMinus2')
export const FilePlus = bold(Iconsax.NoteAdd, 'FilePlus')
export const FileStack = bold(Iconsax.Document, 'FileStack')
export const FileText = bold(Iconsax.DocumentText, 'FileText')
export const FileWarning = bold(Iconsax.DocumentText, 'FileWarning')
export const Files = bold(Iconsax.Document, 'Files')
export const Filter = bold(Iconsax.Filter, 'Filter')
export const Fingerprint = bold(Iconsax.FingerScan, 'Fingerprint')
export const FlaskConical = bold(Iconsax.ChemicalGlass, 'FlaskConical')
export const Forward = bold(Iconsax.Forward, 'Forward')
export const Gauge = bold(Iconsax.Speedometer, 'Gauge')
export const Gift = bold(Iconsax.Gift, 'Gift')
export const Globe = bold(Iconsax.Global, 'Globe')
export const GraduationCap = bold(Iconsax.Teacher, 'GraduationCap')
export const HardDrive = bold(Iconsax.Driver, 'HardDrive')
export const Hash = bold(Iconsax.Hashtag, 'Hash')
export const Heart = bold(Iconsax.Heart, 'Heart')
export const HelpCircle = bold(Iconsax.Lifebuoy, 'HelpCircle')
export const History = bold(Iconsax.Clock, 'History')
export const ImageIcon = bold(Iconsax.Gallery, 'ImageIcon')
export const ImageOff = bold(Iconsax.GallerySlash, 'ImageOff')
export const ImagePlus = bold(Iconsax.GalleryAdd, 'ImagePlus')
export const Infinity = bold(Iconsax.Unlimited, 'Infinity')
export const Info = bold(Iconsax.InfoCircle, 'Info')
export const Italic = bold(Iconsax.TextItalic, 'Italic')
export const Key = bold(Iconsax.Key, 'Key')
export const KeyRound = bold(Iconsax.Key, 'KeyRound')
export const Landmark = bold(Iconsax.Bank, 'Landmark')
export const Languages = bold(Iconsax.Translate, 'Languages')
export const Layers = bold(Iconsax.Layer, 'Layers')
export const Layout = bold(Iconsax.Element3, 'Layout')
export const LayoutDashboard = bold(Iconsax.Category, 'LayoutDashboard')
export const LayoutTemplate = bold(Iconsax.Element3, 'LayoutTemplate')
export const Link = bold(Iconsax.Link, 'Link')
export const Link2 = bold(Iconsax.Link2, 'Link2')
export const Lock = bold(Iconsax.Lock, 'Lock')
export const LogIn = bold(Iconsax.LoginCurve, 'LogIn')
export const LogOut = bold(Iconsax.LogoutCurve, 'LogOut')
export const Mail = bold(Iconsax.Sms, 'Mail')
export const MailCheck = bold(Iconsax.Sms, 'MailCheck')
export const MailX = bold(Iconsax.Sms, 'MailX')
export const MapPin = bold(Iconsax.Location, 'MapPin')
export const MessageSquare = bold(Iconsax.Message, 'MessageSquare')
export const Minus = bold(Iconsax.Minus, 'Minus')
export const Monitor = bold(Iconsax.Monitor, 'Monitor')
export const MonitorDown = bold(Iconsax.DocumentDownload, 'MonitorDown')
export const Moon = bold(Iconsax.Moon, 'Moon')
export const MoreHorizontal = bold(Iconsax.More, 'MoreHorizontal')
export const MoreVertical = bold(Iconsax.More, 'MoreVertical')
export const MousePointer2 = bold(Iconsax.Pointer, 'MousePointer2')
export const MousePointerClick = bold(Iconsax.Pointer, 'MousePointerClick')
export const Package = bold(Iconsax.Box, 'Package')
export const Paintbrush = bold(Iconsax.Brush, 'Paintbrush')
export const Palette = bold(Iconsax.ColorSwatch, 'Palette')
export const PanelLeft = bold(Iconsax.SidebarLeft, 'PanelLeft')
export const Paperclip = bold(Iconsax.Paperclip, 'Paperclip')
export const Pause = bold(Iconsax.Pause, 'Pause')
export const Pen = bold(Iconsax.Edit2, 'Pen')
export const PenLine = bold(Iconsax.Edit2, 'PenLine')
export const Pencil = bold(Iconsax.Edit2, 'Pencil')
export const Phone = bold(Iconsax.Call, 'Phone')
export const Play = bold(Iconsax.Play, 'Play')
export const Plus = bold(Iconsax.Add, 'Plus')
export const Printer = bold(Iconsax.Printer, 'Printer')
export const Receipt = bold(Iconsax.ReceiptText, 'Receipt')
export const Recycle = bold(Iconsax.Broom, 'Recycle')
export const RefreshCw = bold(Iconsax.Refresh2, 'RefreshCw')
export const Reply = bold(Iconsax.Back, 'Reply')
export const RotateCcw = bold(Iconsax.RotateLeft, 'RotateCcw')
export const RotateCw = bold(Iconsax.RotateRight, 'RotateCw')
export const Save = bold(Iconsax.Save2, 'Save')
export const Scale = bold(Iconsax.Judge, 'Scale')
export const ScrollText = bold(Iconsax.Scroll, 'ScrollText')
export const Search = bold(Iconsax.SearchNormal1, 'Search')
export const Send = bold(Iconsax.Send2, 'Send')
export const Server = bold(Iconsax.Data, 'Server')
export const Settings = bold(Iconsax.Setting2, 'Settings')
export const Settings2 = bold(Iconsax.Setting3, 'Settings2')
export const Share2 = bold(Iconsax.Share, 'Share2')
export const Shield = bold(Iconsax.Shield, 'Shield')
export const ShieldAlert = bold(Iconsax.ShieldSecurity, 'ShieldAlert')
export const ShieldCheck = bold(Iconsax.ShieldTick, 'ShieldCheck')
export const ShoppingBag = bold(Iconsax.ShoppingBag, 'ShoppingBag')
export const SkipForward = bold(Iconsax.Next, 'SkipForward')
export const SlidersHorizontal = bold(Iconsax.SliderHorizontal, 'SlidersHorizontal')
export const Smartphone = bold(Iconsax.Mobile, 'Smartphone')
export const Sparkles = bold(Iconsax.MagicStar, 'Sparkles')
export const Star = bold(Iconsax.Star, 'Star')
export const StickyNote = bold(Iconsax.Stickynote, 'StickyNote')
export const Sun = bold(Iconsax.Sun, 'Sun')
export const Tablet = bold(Iconsax.Mobile, 'Tablet')
export const Target = bold(Iconsax.Gps, 'Target')
export const Terminal = bold(Iconsax.Code, 'Terminal')
export const Ticket = bold(Iconsax.Ticket, 'Ticket')
export const Trash2 = bold(Iconsax.Trash, 'Trash2')
export const TrendingDown = bold(Iconsax.TrendDown, 'TrendingDown')
export const TrendingUp = bold(Iconsax.TrendUp, 'TrendingUp')
export const Trophy = bold(Iconsax.Cup, 'Trophy')
export const Type = bold(Iconsax.Text, 'Type')
export const Underline = bold(Iconsax.TextUnderline, 'Underline')
export const Undo2 = bold(Iconsax.ArrowRotateLeft, 'Undo2')
export const Upload = bold(Iconsax.DocumentUpload, 'Upload')
export const User = bold(Iconsax.User, 'User')
export const UserCheck = bold(Iconsax.UserTick, 'UserCheck')
export const UserCog = bold(Iconsax.UserEdit, 'UserCog')
export const UserPlus = bold(Iconsax.ProfileAdd, 'UserPlus')
export const UserRound = bold(Iconsax.ProfileCircle, 'UserRound')
export const Users = bold(Iconsax.Profile2User, 'Users')
export const Users2 = bold(Iconsax.Profile2User, 'Users2')
export const UsersRound = bold(Iconsax.Profile2User, 'UsersRound')
export const Wallet = bold(Iconsax.Wallet, 'Wallet')
export const Wand2 = bold(Iconsax.Magicpen, 'Wand2')
export const Wifi = bold(Iconsax.Wifi, 'Wifi')
export const X = bold(Iconsax.CloseCircle, 'X')
export const XCircle = bold(Iconsax.CloseCircle, 'XCircle')
export const Zap = bold(Iconsax.Flash, 'Zap')

export {
  ALargeSmall,
  Brain,
  Bug,
  Cookie,
  GripVertical,
  Heading2,
  Highlighter,
  List,
  Loader2,
  PartyPopper,
  Power,
  Strikethrough,
  Unlink,
  Webhook,
  WifiOff,
}
