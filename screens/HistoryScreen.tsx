import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Split {
  id: string;
  receipt_image_url: string;
  total_amount: number;
  uploader_phone: string;
  created_at: string;
  split_data: Array<{ name: string; phone: string; amount: number }>;
}

export default function HistoryScreen() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSplits();
  }, []);

  const fetchSplits = async () => {
    try {
      const { data, error } = await supabase
        .from('splits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSplits(data || []);
    } catch (error) {
      console.error('Error fetching splits:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSplits();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (splits.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No splits yet</Text>
        <Text style={styles.emptySubtext}>Create your first bill split</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {splits.map(split => (
        <View key={split.id} style={styles.card}>
          {/* Header with date and amount */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.totalAmount}>
                ${split.total_amount.toFixed(2)}
              </Text>
              <Text style={styles.date}>{formatDate(split.created_at)}</Text>
            </View>
            <Text style={styles.phoneNumber}>{split.uploader_phone}</Text>
          </View>

          {/* Receipt Image */}
          {split.receipt_image_url && (
            <Image
              source={{ uri: split.receipt_image_url }}
              style={styles.receiptImage}
            />
          )}

          {/* Split breakdown */}
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Split Details:</Text>
            {split.split_data.map((item, idx) => (
              <View key={idx} style={styles.breakdownItem}>
                <View>
                  <Text style={styles.breakdownName}>{item.name}</Text>
                  <Text style={styles.breakdownPhone}>{item.phone}</Text>
                </View>
                <Text style={styles.breakdownAmount}>
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Copy button */}
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              const text = `$${split.total_amount.toFixed(2)} split between ${split.split_data.length} people`;
              // In production, use Clipboard API
              alert(text);
            }}
          >
            <Text style={styles.copyButtonText}>📋 Copy Details</Text>
          </TouchableOpacity>
        </View>
      ))}
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  phoneNumber: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  receiptImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 12,
  },
  breakdownContainer: {
    marginVertical: 12,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  breakdownPhone: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  copyButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
