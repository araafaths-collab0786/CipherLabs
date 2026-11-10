import { useEffect, useState } from 'react';
import { NavTab } from '../components/Sidebar';

interface ShortcutOptions {
  onSelectTab: (tabId: NavTab) => void;
  onToggleShortcutsModal: () => void;
  onCloseModal?: () => void;
}

export function useKeyboardShortcuts({
  onSelectTab,
  onToggleShortcutsModal,
  onCloseModal,
}: ShortcutOptions) {
  const [activeShortcutNotice, setActiveShortcutNotice] = useState<{
    label: string;
    keyCombo: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true');

      // Esc closes open modals
      if (e.key === 'Escape') {
        if (onCloseModal) onCloseModal();
        return;
      }

      // Help Modal Trigger: Shift + ? or Alt + / or Ctrl + /
      if (
        (e.shiftKey && e.key === '?') ||
        (e.altKey && e.key === '/') ||
        (e.ctrlKey && e.key === '/')
      ) {
        e.preventDefault();
        onToggleShortcutsModal();
        return;
      }

      // Allow Alt+1..7 or Ctrl+Shift+1..7 navigation
      const isAltNav = e.altKey && !e.ctrlKey;
      const isCtrlShiftNav = e.ctrlKey && e.shiftKey;

      if (!isAltNav && !isCtrlShiftNav) return;

      let targetTab: NavTab | null = null;
      let label = '';
      let combo = '';

      switch (e.key) {
        case '1':
          targetTab = 'dashboard';
          label = 'Dashboard';
          combo = e.altKey ? 'Alt + 1' : 'Ctrl + Shift + 1';
          break;
        case '2':
          targetTab = 'erasure';
          label = 'Secure Erasure';
          combo = e.altKey ? 'Alt + 2' : 'Ctrl + Shift + 2';
          break;
        case '3':
          targetTab = 'recovery';
          label = 'File Recovery';
          combo = e.altKey ? 'Alt + 3' : 'Ctrl + Shift + 3';
          break;
        case '4':
          targetTab = 'verification';
          label = 'Verification Center';
          combo = e.altKey ? 'Alt + 4' : 'Ctrl + Shift + 4';
          break;
        case '5':
          targetTab = 'reports';
          label = 'Reports & Audit';
          combo = e.altKey ? 'Alt + 5' : 'Ctrl + Shift + 5';
          break;
        case '6':
          targetTab = 'devices';
          label = 'Devices';
          combo = e.altKey ? 'Alt + 6' : 'Ctrl + Shift + 6';
          break;
        case '7':
          targetTab = 'settings';
          label = 'Settings';
          combo = e.altKey ? 'Alt + 7' : 'Ctrl + Shift + 7';
          break;
      }

      if (targetTab) {
        e.preventDefault();
        onSelectTab(targetTab);
        setActiveShortcutNotice({ label, keyCombo: combo });

        // Auto-dismiss feedback notice after 1.8s
        setTimeout(() => {
          setActiveShortcutNotice(null);
        }, 1800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab, onToggleShortcutsModal, onCloseModal]);

  return { activeShortcutNotice };
}
