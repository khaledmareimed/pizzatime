'use client';

import { useState } from 'react';
import ImageBanner from '../../components/ImageBanner';
import Offers from '../../components/Offers';
import Products from '../../components/Products';
import type { FoodItem, OfferItem } from '../../funcs/utils';

export default function Home() {
  const handleAddToCart = (item: FoodItem) => {
    // Show toast or notification here
    console.log(`Added ${item.name} to cart`);
  };

  const handleClaimOffer = (offer: OfferItem) => {
    // Handle offer claim logic
    console.log(`Claimed offer: ${offer.title}`);
  };

  const handleViewDetails = (item: FoodItem) => {
    // Handle view product details
    console.log(`Viewing details for: ${item.name}`);
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
        />
      </div>
    </main>
  );
}
