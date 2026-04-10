"use client";

import { createContext, useContext, useMemo, type ComponentPropsWithRef, type ReactNode } from "react";
import {
  TabList as TabListPrimitive,
  TabPanel as TabPanelPrimitive,
  Tab as TabPrimitive,
  Tabs as TabsPrimitive,
} from "react-aria-components";

import { composeTwRenderProps, composeSlotClassName } from "@/lib/compose-tw-render-props";
import { tabsVariants, type TabsVariants } from "./tabs.styles";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  orientation?: "horizontal" | "vertical";
  slots?: ReturnType<typeof tabsVariants>;
  variant?: TabsVariants["variant"];
}

const TabsContext = createContext<TabsContextValue>({});

interface TabsRootProps
  extends ComponentPropsWithRef<typeof TabsPrimitive>,
    TabsVariants {
  children: ReactNode;
  className?: string;
}

const TabsRoot = ({
  children,
  className,
  orientation = "horizontal",
  variant,
  ...props
}: TabsRootProps) => {
  const slots = useMemo(() => tabsVariants({ variant }), [variant]);

  return (
    <TabsContext.Provider value={{ orientation, slots, variant }}>
      <TabsPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="tabs"
        orientation={orientation}
      >
        {children}
      </TabsPrimitive>
    </TabsContext.Provider>
  );
};

interface TabListContainerProps extends ComponentPropsWithRef<"div"> {
  className?: string;
}

const TabListContainer = ({ children, className, ...props }: TabListContainerProps) => {
  const { slots } = useContext(TabsContext);
  return (
    <div className={composeSlotClassName(slots?.tabListContainer, className)} data-slot="tabs-list-container" {...props}>
      {children}
    </div>
  );
};

interface TabListProps extends ComponentPropsWithRef<typeof TabListPrimitive<object>> {
  children: ReactNode;
  className?: string;
}

const TabList = ({ children, className, ...props }: TabListProps) => {
  const { slots } = useContext(TabsContext);
  return (
    <TabListPrimitive {...props} className={composeTwRenderProps(className, slots?.tabList())} data-slot="tabs-list">
      {children}
    </TabListPrimitive>
  );
};

interface TabProps extends ComponentPropsWithRef<typeof TabPrimitive> {
  className?: string;
}

const Tab = ({ children, className, ...props }: TabProps) => {
  const { slots } = useContext(TabsContext);
  return (
    <TabPrimitive {...props} className={composeTwRenderProps(className, slots?.tab())} data-slot="tabs-tab">
      {children}
    </TabPrimitive>
  );
};

const TabIndicator = (_props: { className?: string }) => null;

interface TabPanelProps extends Omit<ComponentPropsWithRef<typeof TabPanelPrimitive>, "children"> {
  children: ReactNode;
  className?: string;
}

const TabPanel = ({ children, className, ...props }: TabPanelProps) => {
  const { slots } = useContext(TabsContext);
  return (
    <TabPanelPrimitive {...props} className={composeTwRenderProps(className, slots?.tabPanel())} data-slot="tabs-panel">
      {children}
    </TabPanelPrimitive>
  );
};

interface TabSeparatorProps extends ComponentPropsWithRef<"span"> {
  className?: string;
}

const TabSeparator = ({ className, ...props }: TabSeparatorProps) => {
  const { slots } = useContext(TabsContext);
  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.separator, className)}
      data-slot="tabs-separator"
      {...props}
    />
  );
};

interface LegacyTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface LegacyTabsProps {
  tabs: LegacyTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs = ({ tabs, activeTab, onChange, className }: LegacyTabsProps) => (
  <div className={cn("tabs", className)} data-slot="tabs">
    <div className="tabs__list tabs__list--secondary">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          data-selected={activeTab === tab.id ? "true" : undefined}
          className={cn(
            "tabs__tab",
            activeTab === tab.id && "tabs__tab--selected"
          )}
          type="button"
        >
          {tab.icon && <span className="tabs__tab-icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

export {
  TabsRoot,
  TabListContainer,
  TabList,
  Tab,
  TabIndicator,
  TabPanel,
  TabSeparator,
  Tabs,
};
export type {
  TabsRootProps,
  TabListContainerProps,
  TabListProps,
  TabProps,
  TabPanelProps,
  TabSeparatorProps,
  LegacyTabsProps,
};
