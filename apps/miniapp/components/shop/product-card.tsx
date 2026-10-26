'use client';
import { Crown, Diamond, ShoppingCart, Ticket } from 'lucide-react';
import { useI18n } from '../language-provider';
import { formatPrice, type Product } from '../../lib/shop/catalog';
export function ProductCard({ product, onBuy, featured = false }: {
    product: Product;
    onBuy: () => void;
    featured?: boolean;
}) {
    const { t } = useI18n();
    const Icon = product.icon === 'ticket' ? Ticket : product.icon === 'crown' ? Crown : Diamond;
    return <article className={`product-card ${featured ? 'product-featured' : ''}`}><div className="product-card-top"><div className="product-icon"><Icon size={23}/></div>{product.badge && <span className="product-badge">{t(product.badge)}</span>}</div><h3>{t(product.title)}</h3><p>{t(product.subtitle)}</p><div className="product-price">{formatPrice(product.price)}</div>{product.oldPrice && <div className="old-price">{formatPrice(product.oldPrice)}</div>}<button className="button primary full" onClick={onBuy}><ShoppingCart size={15}/>{" " + t("Sotib olish")}</button></article>;
}
