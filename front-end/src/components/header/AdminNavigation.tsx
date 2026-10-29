import { useState } from 'react';
import { Box, ClipboardList, ChartNoAxesCombined, LayoutDashboard, Menu, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ICON_CONFIG } from '../../constant/iconConfig';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../ui/sheet';

const items = [
  { to: '/home', label: 'Produtos', icon: Box },
  { to: '/pedidos', label: 'Pedidos', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Métricas', icon: ChartNoAxesCombined },
  { to: '/admin/audit-logs', label: 'Auditoria', icon: ClipboardList },
];
const controlClass =
  'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md p-2 text-brand-amber hover:bg-brand-amber/15 focus-visible:outline-2 focus-visible:outline-brand-amber';

export const AdminNavigation = ({ onAdd }: { onAdd: () => void }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const controls = (mobile: boolean) => (
    <>
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          aria-label={label}
          title={label}
          aria-current={pathname === to ? 'page' : undefined}
          className={`${controlClass} ${pathname === to ? 'bg-brand-amber/20 ring-brand-amber ring-1' : ''}`}
          onClick={() => setOpen(false)}
        >
          <Icon size={ICON_CONFIG.mxSize} strokeWidth={ICON_CONFIG.strokWidth} aria-hidden="true" />
          <span className={mobile ? '' : 'sr-only'}>{label}</span>
        </Link>
      ))}
      <button
        type="button"
        className={controlClass}
        aria-label="Adicionar produto"
        title="Adicionar produto"
        onClick={() => {
          setOpen(false);
          onAdd();
        }}
      >
        <Plus size={ICON_CONFIG.mxSize} strokeWidth={ICON_CONFIG.strokWidth} aria-hidden="true" />
        <span className={mobile ? '' : 'sr-only'}>Adicionar produto</span>
      </button>
    </>
  );
  return (
    <>
      <nav aria-label="Administração" className="hidden gap-1 md:flex">
        {controls(false)}
      </nav>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger aria-label="Abrir administração" className={controlClass}>
            <Menu size={ICON_CONFIG.mxSize} aria-hidden="true" />
          </SheetTrigger>
          <SheetContent className="bg-brand-dark text-brand-amber p-5">
            <SheetTitle className="text-brand-amber">Administração</SheetTitle>
            <SheetDescription>Navegue pelas áreas administrativas.</SheetDescription>
            <nav aria-label="Administração mobile" className="flex flex-col gap-2">
              {controls(true)}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
