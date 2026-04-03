"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiBarChart2, 
  FiLayers, 
  FiMenu, 
  FiBell, 
  FiSearch,
  FiX
} from "react-icons/fi";
import styles from "./dashboard.module.css";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "Analytics", href: "/dashboard/analytics", icon: FiBarChart2 },
  { name: "Users", href: "/dashboard/users", icon: FiUsers },
  { name: "Projects", href: "/dashboard/projects", icon: FiLayers },
  { name: "Settings", href: "/dashboard/settings", icon: FiSettings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile Overlay */}
      <div 
        className={`${styles.overlay} ${isMobileMenuOpen ? styles.open : ""}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brand}>
            <div className={styles.brandIcon}>
              <FiLayers size={22} />
            </div>
            SAASIO
          </Link>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                <item.icon className={styles.navIcon} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button 
            className={styles.mobileTrigger} 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <FiMenu size={24} />
          </button>

          <div className={styles.searchContainer}>
            <FiSearch size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className={styles.searchInput}
            />
          </div>

          <div className={styles.topbarActions}>
            <button className={styles.iconButton}>
              <FiBell size={20} />
              <span className={styles.badge}>3</span>
            </button>
            <button className={styles.profileButton}>
              <div className={styles.avatar}>A</div>
              <span className={styles.profileName}>Admin User</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.contentWrapper}>
          {children}
        </main>
      </div>
    </div>
  );
}
