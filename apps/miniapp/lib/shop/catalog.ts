export type Product = {
    supplier?: 'resellcodes';
    id: string;
    title: string;
    subtitle: string;
    diamonds: string;
    price: number;
    oldPrice?: number;
    badge?: string;
    icon: 'diamond' | 'ticket' | 'crown';
};
// Legacy demo products are retained only to label historical local orders.
export const products: Product[] = [
    { id: 'd56', title: '56 Olmos', subtitle: 'Tezkor to‘ldirish', diamonds: '56', price: 14000, badge: 'Mashhur', icon: 'diamond' },
    { id: 'd172', title: '172 Olmos', subtitle: 'Bonusli paket', diamonds: '172', price: 39000, oldPrice: 42000, badge: '-7%', icon: 'diamond' },
    { id: 'd278', title: '278 + 28 Olmos', subtitle: 'Qo‘shimcha bonus', diamonds: '306', price: 69000, badge: 'Foydali', icon: 'diamond' },
    { id: 'd568', title: '568 + 56 Olmos', subtitle: 'Ko‘proq olmos', diamonds: '624', price: 139000, icon: 'diamond' },
    { id: 'weekly', title: 'Weekly Diamond Pass', subtitle: 'Haftalik olmos va sovrinlar', diamonds: 'Pass', price: 24000, oldPrice: 29000, badge: 'Tejamkor', icon: 'ticket' },
    { id: 'starlight', title: 'Starlight Pass', subtitle: 'Oylik eksklyuziv mukofotlar', diamonds: 'Pass', price: 78000, icon: 'crown' },
];

export const formatPrice = (price: number) => `${price.toLocaleString('en-US').replace(/,/g, ' ')} UZS`;
