import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree, User, LogOut, History, LayoutDashboard, CalendarDays } from "lucide-react";


// Import các component của shadcn/ui
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

function Header() {
  const { isAuthed, user, role, logout } = useAuth();
  const nav = useNavigate();

  const items = [
    { to: "/", label: "Trang chủ" },
    { to: "/rooms", label: "Phòng" },
    { to: "/gioi-thieu", label: "Giới thiệu" },
    { to: "/lien-he", label: "Liên hệ" },
  ];

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Palmtree className="h-6 w-6" />
          <span>Núi Homestay</span>
        </Link>

        {/* Desktop Navigation - Dùng NavigationMenu của shadcn */}
        <NavigationMenu>
          <NavigationMenuList>
            {items.map((i) => (
              <NavigationMenuItem key={i.to}>
                <NavLink to={i.to} className={navigationMenuTriggerStyle()}>
                  {i.label}
                </NavLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* User / Action Buttons */}
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Quản lý
              </Link>
            </Button>
          )}

          {role === "receptionist" && (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/reception">
                <CalendarDays className="h-4 w-4 mr-2" />
                Lễ tân
              </Link>
            </Button>
          )}

          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || "Tài khoản"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/lich-su" className="cursor-pointer">
                    <History className="h-4 w-4 mr-2" />
                    Lịch sử đặt phòng
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">
                <User className="h-4 w-4 mr-2" />
                Đăng nhập
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted text-muted-foreground mt-20">
      <div className="container mx-auto px-4 py-12 grid grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-foreground text-lg mb-2">
            <Palmtree className="h-5 w-5 text-primary" /> Núi Homestay
          </div>
          <p className="text-sm leading-relaxed">
            Homestay yên bình giữa lòng cố đô Huế. Cách trung tâm 3,6km, không gian xanh mát và đầy đủ tiện nghi.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Kết nối</h4>
          <p className="text-sm">Facebook: Núi Homestay</p>
          <p className="text-sm">TikTok: Nui@123</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Thông tin liên hệ</h4>
          <p className="text-sm">Điện thoại: 035 356 600</p>
          <p className="text-sm">Email: Nuihomstay@gmail.com</p>
          <p className="text-sm">Địa chỉ: TP. Huế</p>
        </div>
      </div>

      <Separator />

      <div className="py-4 text-center text-xs">
        © {new Date().getFullYear()} Núi Homestay. All rights reserved.
      </div>
    </footer>
  );
}

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
     
    </div>
  );
}