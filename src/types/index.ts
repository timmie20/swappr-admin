import { Icons } from '@/components/icons';
import { Brand } from '@/features/brands';
import { Model } from '@/features/models/types/models.types';

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

export type Option = {
  label: string;
  value: string;
  valuationAmount?: number;
  adjustmentType?: 'addition' | 'deduction';
};

export type Dependency = {
  id: string;
  value: string;
};

export type Question = {
  id: string;
  label: string;
  slug: string;
  type: 'text' | 'radio' | 'select' | 'multi-select' | 'range' | 'damages';
  required?: boolean;
  options?: Option[];
  dependsOn?: Dependency;
  note?: string;
};

export type StorageVariation = {
  capacity: number;
  price: number;
};

export interface InitialModelData extends Model {}

export type ValuationParameter = {
  questionId: string;
  optionId: string;
  adjustmentType: 'add' | 'deduct';
  amount: number;
};

export type CreateAdminProps = {
  first_name: string;
  last_name: string;
  email_address: string;
  role: string;
  password: string;
};
