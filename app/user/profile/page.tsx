'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  LogOut,
  Shield,
  Bell,
  Globe,
  Heart,
  ShoppingBag,
  Clock,
  Loader,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive } from '../../../funcs/responsive';
import { formatJordanDate } from '../../../funcs/jordanLocale';
import { User as UserType, UserAddress } from '../../../funcs/collections/user';
import { useToastContext } from '../../../funcs/contexts/ToastContext';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import AddressForm from '../../../components/AddressForm';
import OrdersSection from '../../../components/OrdersSection';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateJoined: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToastContext();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Real user data from database
  const [userData, setUserData] = useState<UserType | null>(null);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalFavorites: 0,
    lastOrderDate: null as Date | null
  });

  // Fetch user data on component mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className={cn('text-lg', theme.text.secondary)}>تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  // Function to resolve actual location name from delivery areas
  const resolveLocationName = (cityId: string, locationId: string, fallbackLocation: string): string => {
    if (!cityId || !locationId || cityId === 'default-city-id' || locationId === 'default-location-id') {
      return fallbackLocation === 'منطقة افتراضية' ? '' : fallbackLocation;
    }

    const city = deliveryAreas.find(area => area._id === cityId);
    if (!city) {
      return fallbackLocation === 'منطقة افتراضية' ? '' : fallbackLocation;
    }

    const location = city.locations?.find((loc: any) => loc._id === locationId);
    if (!location) {
      return fallbackLocation === 'منطقة افتراضية' ? '' : fallbackLocation;
    }

    return location.locationName || (fallbackLocation === 'منطقة افتراضية' ? '' : fallbackLocation);
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch delivery areas first
      const areasResponse = await fetch('/api/public/delivery-areas');
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setDeliveryAreas(areasData.data?.areas || []);
      }

      // Fetch user profile
      const userResponse = await fetch('/api/users');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserData(userData.data);
      }

      // Fetch user addresses using direct API
      let addressResponse = await fetch('/api/users/addresses-direct');
      if (!addressResponse.ok) {
        // Fallback to regular API
        addressResponse = await fetch('/api/users/addresses');
      }
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        setUserAddresses(addressData.data || []);
      }

      // Fetch user orders for stats
      const ordersResponse = await fetch('/api/users/orders?limit=1');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrderStats(prev => ({
          ...prev,
          totalOrders: ordersData.pagination?.total || 0,
          lastOrderDate: ordersData.data?.[0]?.createdAt ? new Date(ordersData.data[0].createdAt) : null
        }));
      }

      // Fetch favorites count
      const favoritesResponse = await fetch('/api/users/favorites');
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        setOrderStats(prev => ({
          ...prev,
          totalFavorites: favoritesData.data?.length || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignOut = () => {
    signOut();
  };

  const handleAddAddress = async (addressData: Omit<UserAddress, '_id'>) => {
    try {
      const response = await fetch('/api/users/addresses-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.data);
        toast.success('تم إضافة العنوان بنجاح!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('خطأ في إضافة العنوان', error instanceof Error ? error.message : 'خطأ غير معروف');
    }
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleUpdateAddress = async (addressData: Omit<UserAddress, '_id'>) => {
    if (!editingAddress?._id) return;

    try {
      const response = await fetch('/api/users/addresses-direct', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressId: editingAddress._id,
          ...addressData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.data);
        setEditingAddress(null);
        toast.success('تم تحديث العنوان بنجاح!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('خطأ في تحديث العنوان', error instanceof Error ? error.message : 'خطأ غير معروف');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const deleteAddress = async () => {
      try {
        const response = await fetch(`/api/users/addresses-direct?id=${addressId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const data = await response.json();
          setUserAddresses(data.data);
          toast.success('تم حذف العنوان بنجاح!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete address');
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('خطأ في حذف العنوان', error instanceof Error ? error.message : 'خطأ غير معروف');
      }
    };

    // Show custom confirmation dialog
    setConfirmDialogData({
      title: 'حذف العنوان',
      message: 'هل أنت متأكد من حذف هذا العنوان؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: deleteAddress
    });
    setShowConfirmDialog(true);
  };

  const stats = [
    {
      icon: ShoppingBag,
      label: 'إجمالي الطلبات',
      value: orderStats.totalOrders.toString(),
      color: 'text-blue-600'
    },
    {
      icon: Heart,
      label: 'المفضلة',
      value: orderStats.totalFavorites.toString(),
      color: 'text-red-600'
    },
    {
      icon: Clock,
      label: 'آخر طلب',
      value: orderStats.lastOrderDate 
        ? `${Math.ceil((Date.now() - orderStats.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))} أيام`
        : 'لا يوجد',
      color: 'text-green-600'
    }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className={cn('text-lg', theme.text.secondary)}>تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Header Section */}
      <section className={cn(
        'relative py-16',
        theme.background.secondary
      )}>
        <div className={cn(responsive.container.lg, 'px-4 text-center')}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-orange-500 mr-3" />
              <h1 className={cn(
                'font-bold',
                responsive.fontSize['3xl'],
                theme.text.primary
              )}>
                الملف الشخصي
              </h1>
            </div>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
              إدارة معلوماتك الشخصية وإعداداتك
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className={cn(responsive.container.lg, 'px-4 py-8')}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn(
                  'font-bold',
                  responsive.fontSize.xl,
                  theme.text.primary
                )}>
                  المعلومات الشخصية
                </h2>
              </div>

              {/* Profile Image */}
              <div className="flex items-center mb-6">
                <div className="relative">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'المستخدم'}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className={cn(
                      'w-20 h-20 rounded-2xl flex items-center justify-center',
                      'bg-orange-500 text-white'
                    )}>
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  
                  {session.user?.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="mr-4">
                  <h3 className={cn(
                    'font-bold',
                    responsive.fontSize.lg,
                    theme.text.primary
                  )}>
                    {userData?.name || session.user?.name}
                  </h3>
                  <p className={cn('text-sm', theme.text.secondary)}>
                    {userData?.role === 'admin' ? 'مدير' : 'عضو'}
                  </p>
                  <p className={cn('text-xs', theme.text.secondary)}>
                    عضو منذ {userData?.dateJoined ? formatJordanDate(userData.dateJoined) : 'غير محدد'}
                  </p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    theme.text.primary
                  )}>
                    البريد الإلكتروني
                  </label>
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                    theme.background.secondary
                  )}>
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className={theme.text.primary}>{userData?.email || session.user?.email}</span>
                  </div>
                  <p className={cn('text-xs mt-1', theme.text.secondary)}>
                    لا يمكن تعديل البريد الإلكتروني
                  </p>
                </div>


                {/* Addresses Management */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className={cn(
                      'block text-sm font-medium',
                      theme.text.primary
                    )}>
                      العناوين المحفوظة
                    </label>
                    
                    <Button
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressForm(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة عنوان
                    </Button>
                  </div>

                  {userAddresses.length === 0 ? (
                    <div className={cn(
                      'text-center py-8 rounded-xl',
                      theme.background.secondary
                    )}>
                      <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className={cn('mb-4', theme.text.secondary)}>
                        لا توجد عناوين محفوظة
                      </p>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setShowAddressForm(true);
                        }}
                        variant="accent"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة عنوان جديد
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userAddresses.map((address) => (
                        <div
                          key={address._id}
                          className={cn(
                            'p-4 rounded-xl border',
                            theme.border.primary,
                            theme.background.card
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className={cn('font-medium', theme.text.primary)}>
                                  {address.name}
                                </h4>
                                {address.isDefault && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                                    افتراضي
                                  </span>
                                )}
                              </div>
                              
                              <p className={cn('text-sm mb-1', theme.text.secondary)}>
                                {(() => {
                                  const resolvedLocation = resolveLocationName(address.cityId, address.locationId, address.location);
                                  return `${address.city}${resolvedLocation && resolvedLocation.trim() ? ` - ${resolvedLocation}` : ''}`;
                                })()}
                              </p>
                              
                              <p className={cn('text-sm mb-1', theme.text.secondary)}>
                                {address.addressDetails}
                              </p>
                              
                              <p className={cn('text-sm', theme.text.secondary)}>
                                {address.phone}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                                  theme.text.secondary
                                )}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteAddress(address._id!)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Stats */}
            <Card className="p-6">
              <h3 className={cn(
                'font-bold mb-4',
                responsive.fontSize.lg,
                theme.text.primary
              )}>
                إحصائياتك
              </h3>
              
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={cn('w-5 h-5', stat.color)} />
                        <span className={cn('text-sm', theme.text.secondary)}>
                          {stat.label}
                        </span>
                      </div>
                      <span className={cn('font-bold', theme.text.primary)}>
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6">
              <h3 className={cn(
                'font-bold mb-4',
                responsive.fontSize.lg,
                theme.text.primary
              )}>
                الإعدادات
              </h3>
              
              <div className="space-y-4">
                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className={cn('text-sm', theme.text.primary)}>
                      الإشعارات
                    </span>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      notifications ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      notifications ? 'translate-x-6' : 'translate-x-0.5'
                    )} />
                  </button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span className={cn('text-sm', theme.text.primary)}>
                      اللغة
                    </span>
                  </div>
                  <span className={cn('text-sm', theme.text.secondary)}>
                    العربية
                  </span>
                </div>
              </div>
            </Card>

            {/* Orders Section */}
            <OrdersSection />

            {/* Sign Out */}
            <Card className="p-6">
              <Button
                onClick={handleSignOut}
                variant="outline"
                fullWidth
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressForm
        isOpen={showAddressForm}
        onClose={() => {
          setShowAddressForm(false);
          setEditingAddress(null);
        }}
        onSave={editingAddress ? handleUpdateAddress : handleAddAddress}
        editingAddress={editingAddress}
        isSubmitting={isSubmitting}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmDialogData(null);
        }}
        onConfirm={confirmDialogData?.onConfirm || (() => {})}
        title={confirmDialogData?.title || ''}
        message={confirmDialogData?.message || ''}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}