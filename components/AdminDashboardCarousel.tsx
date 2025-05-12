// AdminDashboardCarousel.tsx

import React from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import {
    useSharedValue,
    // ICarouselInstance is not exported from 'react-native-reanimated'
} from 'react-native-reanimated';
import Carousel, {
    Pagination,
    ICarouselInstance,
} from 'react-native-reanimated-carousel';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface DashboardItem {
    id: string;
    title: string;
    value: number;
    icon: string;
}

const data: DashboardItem[] = [
    { id: '1', title: 'Supplies', value: 150, icon: 'cube-outline' },
    { id: '2', title: 'Pending', value: 25, icon: 'time-outline' },
    { id: '3', title: 'Needs Repair', value: 5, icon: 'hammer-outline' },
    { id: '4', title: 'New Users', value: 10, icon: 'person-add-outline' },
    { id: '5', title: 'Low Stock', value: 12, icon: 'warning-outline' },
    { id: '6', title: 'Total Requests', value: 78, icon: 'list-outline' },
];
const width: number = Dimensions.get('window').width;
const CAROUSEL_HEIGHT: number = 120;

const AdminDashboardCarousel = () => {
    const ref = React.useRef<ICarouselInstance>(null);
    const progress = useSharedValue<number>(0);
    const { colors } = useTheme();

    const onPressPagination = (index: number) => {
        ref.current?.scrollTo({
            count: index - progress.value,
            animated: true,
        });
    };

    const renderItem = ({ item }: { item: DashboardItem }) => (
        <View style={styles.carouselItem}>
            <Card style={[styles.dashboardCard, { backgroundColor: '#1c398e' }]}>
                <Card.Content style={styles.cardContent}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={30} color={colors.onPrimary} marginBottom={5} />
                    <Title style={[styles.cardTitle, { color: colors.onPrimary }]}>{item.title}</Title>
                    <Paragraph style={[styles.cardValue, { color: colors.secondary }]}>{item.value}</Paragraph>
                </Card.Content>
            </Card>
        </View>
    );

    return (
        <View style={styles.container}>
            <Carousel
                ref={ref}
                width={width * 0.9}
                height={CAROUSEL_HEIGHT}
                data={data}
                onProgressChange={progress}
                renderItem={renderItem}
                loop={false}
            />
            <Pagination.Basic
                data={data}
                progress={progress}
                containerStyle={styles.paginationContainer}
                dotStyle={styles.paginationDot}
                activeDotStyle={{ opacity: 0.5 }}
                onPress={onPressPagination}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    carouselItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dashboardCard: {
        width: '90%',
        height: '90%',
        borderRadius: 8,
        elevation: 3,
        justifyContent: 'center',
    },
    cardContent: {
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 2,
    },
    cardValue: {
        fontSize: 20,
        textAlign: 'center',
    },
    paginationContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        justifyContent: 'center',
    },
    paginationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
});

export default AdminDashboardCarousel;