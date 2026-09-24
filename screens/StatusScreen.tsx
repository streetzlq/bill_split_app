import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface PendingPayment {
  id: string;
  split_id: string;
  recipient_phone: string;
  amount_owed: number;
  is_paid: boolean;
  created_at: string;
  split_uploader_phone?: string;
}

export default function StatusScreen() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myPhone, setMyPhone] = useState('');
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [myPhone, payments]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('split_status')
        .select('*, splits(uploader_phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(p => ({
        id: p.id,
        split_id: p.split_id,
        recipient_phone: p.recipient_phone,
        amount_owed: p.amount_owed,
        is_paid: p.is_paid,
        created_at: p.created_at,
        split_uploader_phone: p.splits?.uploader_phone,
      })) || [];

      setPayments(formatted);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
    setLoading(false);
  };

  const filterPayments = () => {
    if (!myPhone) {
      setFilteredPayments(payments);
      return;
    }

    // Show payments I owe OR payments others owe me
    const filtered = payments.filter(
      p =>
        p.recipient_phone === myPhone || p.split_uploader_phone === myPhone
    );
    setFilteredPayments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const togglePaid = async (paymentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('split_status')
        .update({ is_paid: !currentStatus })
        .eq('id', paymentId);

      if (error) throw error;

      setPayments(
        payments.map(p =>
          p.id === paymentId ? { ...p, is_paid: !currentStatus } : p
        )
      );

      Alert.alert('Updated', currentStatus ? 'Marked as pending' : 'Marked as paid');
    } catch (error) {
      Alert.alert('Error', 'Could not update payment status');
    }
  };

  const calculateStats = () => {
    const pending = filteredPayments.filter(p => !p.is_paid).length;
    const paid = filteredPayments.filter(p => p.is_paid).length;
    const totalPending = filteredPayments
      .filter(p => !p.is_paid)
      .reduce((sum, p) => sum + p.amount_owed, 0);
    const totalPaid = filteredPayments
      .filter(p => p.is_paid)
      .reduce((sum, p) => sum + p.amount_owed, 0);

    return { pending, paid, totalPending, totalPaid };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Filter by phone */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by your phone:</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="+1234567890"
          keyboardType="phone-pad"
          value={myPhone}
          onChangeText={setMyPhone}
        />
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statAmount}>
            ${stats.totalPending.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statCard, styles.paidCard]}>
          <Text style={styles.statNumber}>{stats.paid}</Text>
          <Text style={styles.statLabel}>Paid</Text>
          <Text style={styles.statAmount}>
            ${stats.totalPaid.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment list */}
      {filteredPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payments to show</Text>
        </View>
      ) : (
        filteredPayments.map(payment => (
          <TouchableOpacity
            key={payment.id}
            style={styles.paymentCard}
            onPress={() => togglePaid(payment.id, payment.is_paid)}
          >
            <View style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentPhone}>
                  {payment.recipient_phone}
                </Text>
                <Text style={styles.paymentUploader}>
                  From: {payment.split_uploader_phone}
                </Text>
                <Text style={styles.paymentDate}>
                  {new Date(payment.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.paymentAmount}>
                <Text style={styles.amount}>
                  ${payment.amount_owed.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.badge,
                    payment.is_paid ? styles.paidBadge : styles.pendingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      payment.is_paid ? styles.paidText : styles.pendingText,
                    ]}
                  >
                    {payment.is_paid ? '✓ Paid' : '⏳ Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pendingCard: {
    backgroundColor: '#FFF3E0',
  },
  paidCard: {
    backgroundColor: '#E8F5E9',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPhone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  paymentUploader: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paymentDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  paymentAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFE0B2',
  },
  paidBadge: {
    backgroundColor: '#C8E6C9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingText: {
    color: '#F57C00',
  },
  paidText: {
    color: '#2E7D32',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
