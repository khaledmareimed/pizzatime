'use client';

import { useRouter } from 'next/navigation';
import ImageBanner from '../../components/ImageBanner';
import Offers from '../../components/Offers';
import Products from '../../components/Products';
import { useCartContext } from '../../funcs/contexts/CartContext';
import type { OfferItem } from '../../funcs/utils';
import type { Product } from '../../funcs/collections/product';

export default function Home() {
  const router = useRouter();
  const { addItem } = useCartContext();

  const handleAddToCart = (item: Product) => {
    // Add item to real cart with localStorage persistence
    addItem(item, 1, [], undefined);
    
    // Show success feedback (you could replace with a toast notification)
    alert(`تم إضافة ${item.productName} إلى السلة!`);
  };

  const handleClaimOffer = (offer: OfferItem) => {
    // Handle offer claim logic
    console.log(`Claimed offer: ${offer.title}`);
  };

  const handleViewDetails = (item: Product) => {
    // Navigate to item detail page
    router.push(`/user/item/${item._id}`);
  };

  const handleBannerAction = (slide: any) => {
    // Handle banner CTA clicks
    console.log(`Banner action: ${slide.title}`);
    // Could scroll to products, open menu, etc.
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      {/* Image Banner */}
      <ImageBanner onSlideAction={handleBannerAction} />

      {/* Offers Section */}
      <Offers onClaimOffer={handleClaimOffer} />

      {/* Products Section */}
      <div id="products">
        <Products
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
          limit={6}
        />
      </div>
    </main>
  );
}
