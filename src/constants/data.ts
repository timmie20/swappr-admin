import { InitialModelData, NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Brands',
    url: '/dashboard/brand',
    icon: 'phone',
    shortcut: ['b', 'b'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Models',
    url: '/dashboard/model',
    icon: 'phone',
    shortcut: ['md', 'md'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Questions',
    url: '/dashboard/questions',
    icon: 'question',
    shortcut: ['q', 'q'],
    isActive: false,
    items: [] // No child items
  },

  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Create ',
        url: '/dashboard/create-account',
        icon: 'userPlus',
        shortcut: ['c', 'c']
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];

export const modelData: InitialModelData = {
  name: '',
  brand: ' ',
  base: 0,
  description: '',
  storageVariations: [],
  valuationElements: [
    {
      id: 'q1',
      slug: 'condition',
      label: 'What is the condition of your phone?',
      type: 'radio',
      required: true,
      options: [
        {
          label: 'Mint',
          value: 'mint'
        },
        { label: 'Good', value: 'good' },
        { label: 'Fair', value: 'fair' },
        { label: 'Bad', value: 'bad' }
      ],
      note: 'Mint means brand new that Hasn’t been used'
    },
    {
      id: 'q2',
      slug: 'connections',
      label: "Is your phone's wireless and mobile data working fine?",
      type: 'radio',
      required: true,
      options: [
        { label: 'Yep, everything’s working', value: 'yes' },
        { label: 'Nope, something’s not working', value: 'no' }
      ]
    },
    {
      id: 'q3',
      slug: 'faulty-connections',
      label: 'Select the wireless or cellular features that do NOT work',
      type: 'select',
      required: true,
      dependsOn: {
        id: 'q2',
        value: 'no'
      },
      options: [
        { label: 'Wi-Fi', value: 'wifi' },
        { label: 'Mobile Service', value: 'mobile_service' },
        { label: 'Bluetooth', value: 'bluetooth' },
        {
          label: 'Airdrop',
          value: 'airdrop'
        },
        { label: 'Hotspot', value: 'hotspot' }
      ],
      note: "Airdrop will be Automatically selected if either wifi and/or bluetooth doesn't work"
    },
    {
      id: 'q4',
      slug: 'security-feature-faceid',
      label: 'Does your phone Face ID work?',
      type: 'radio',
      required: true,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
        { label: 'I use Touch ID', value: 'n/a' }
      ]
    },
    {
      id: 'q5',
      slug: 'security-feature-touchid',
      label: 'Does your Touch ID properly?',
      type: 'radio',
      required: true,
      dependsOn: {
        id: 'q3',
        value: 'n/a'
      },
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    },
    {
      id: 'q6',
      label: "What's your battery health percentage?",
      slug: 'battery-health',
      type: 'range',
      required: true,
      note: 'Drag the range bar to your battery health percentage, any lower than 80 is Considered service'
    },
    {
      id: 'q7',
      label: 'Does your phone have the True Tone feature?',
      slug: 'display',
      type: 'radio',
      required: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
        { label: 'Not Available', value: 'n/a' }
      ],
      note: 'To check this, swipe down from the top-right of your iphone and hold on the brightness bar, you should see true tone at the bottom'
    },
    {
      id: 'q8',
      label: 'Does your phone show any of these warning messages?',
      slug: 'warning-errors',
      type: 'select',
      required: false,
      options: [
        { label: 'Important Display Message (IDM)', value: 'idm' },
        { label: 'Important Battery Message (IBM)', value: 'ibm' },
        { label: "Nope, it doesn't", value: 'none' }
      ],
      note: 'Select all that applies'
    },
    {
      id: 'q9',
      label: 'Does Snapchat work on your phone?',
      slug: 'apps',
      type: 'radio',
      required: true,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    },
    {
      id: 'q10',
      label: 'Which parts of your phone are faulty?',
      slug: 'device-damages',
      type: 'damages',
      required: false,
      options: [
        {
          label: 'Screen',
          value: 'screen'
        },
        { label: 'Back Camera', value: 'back_camera' },
        { label: 'Front Camera', value: 'front_camera' },
        { label: 'Battery', value: 'battery' },
        { label: 'Speakers', value: 'speakers' },
        { label: 'Charging Port', value: 'charging_port' },
        { label: 'Power button', value: 'power_button' },
        { label: 'Action Button', value: 'action_button' }
      ],
      note: 'Select all the Faulty parts of your device'
    }
  ]
};
