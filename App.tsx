import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { ClassSchedule, DayOfWeek } from './types';
import classScheduleData from './class_schedule.json';

const GROUPS = ['L4CG1', 'L4CG2', 'L4CG3', 'L4CG4'];
const DAYS: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAY_NAMES: Record<DayOfWeek, string> = {
  'SUN': 'Sunday',
  'MON': 'Monday',
  'TUE': 'Tuesday',
  'WED': 'Wednesday',
  'THU': 'Thursday',
  'FRI': 'Friday',
  'SAT': 'Saturday',
};

const GROUP_STORAGE_KEY = 'selected_group';
const THEME_STORAGE_KEY = 'app_theme';

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = dayMap[dayIndex] as DayOfWeek;
    return DAYS.includes(currentDay) ? currentDay : 'ALL';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const [savedGroup, savedTheme] = await Promise.all([
        SecureStore.getItemAsync(GROUP_STORAGE_KEY),
        SecureStore.getItemAsync(THEME_STORAGE_KEY)
      ]);
      
      if (savedGroup && GROUPS.includes(savedGroup)) {
        setSelectedGroup(savedGroup);
      }
      
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.log('Error loading saved data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGroup = async (group: string) => {
    try {
      await SecureStore.setItemAsync(GROUP_STORAGE_KEY, group);
      setSelectedGroup(group);
    } catch (error) {
      console.log('Error saving group:', error);
      Alert.alert('Error', 'Failed to save group selection');
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const changeGroup = () => {
    Alert.alert(
      'Change Group',
      'Are you sure you want to change your group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync(GROUP_STORAGE_KEY);
              setSelectedGroup(null);
            } catch (error) {
              console.log('Error clearing group:', error);
            }
          }
        }
      ]
    );
  };

  const filteredSchedule = useMemo(() => {
    if (!selectedGroup) return [];
    
    const schedule = classScheduleData as ClassSchedule[];
    let filtered = schedule.filter(item => 
      item.Group.includes(selectedGroup)
    );

    if (selectedDay !== 'ALL') {
      filtered = filtered.filter(item => item.Day === selectedDay);
    }

    return filtered;
  }, [selectedGroup, selectedDay]);

  const groupedByDay = useMemo(() => {
    const grouped: { [key: string]: ClassSchedule[] } = {};
    
    filteredSchedule.forEach(item => {
      if (!grouped[item.Day]) {
        grouped[item.Day] = [];
      }
      grouped[item.Day].push(item);
    });
    
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = a.Time.split(' - ')[0];
        const timeB = b.Time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  }, [filteredSchedule]);

  const theme = {
    primary: 'rgb(240, 73, 156)',
    background: isDarkMode ? '#121212' : '#ffffff',
    surface: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#b3b3b3' : '#666666',
    border: isDarkMode ? '#333333' : '#000000',
    card: isDarkMode ? '#2a2a2a' : '#ffffff',
    accent: isDarkMode ? '#333333' : '#f5f5f5',
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  const renderGroupSelection = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
     
      <Text style={[styles.title, { color: theme.text }]}>Student Routine App</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Select your group to view schedule</Text>
      
      <View style={styles.groupContainer}>
        {GROUPS.map((group) => (
          <TouchableOpacity
            key={group}
            style={[styles.groupButton, { 
              borderColor: theme.primary,
              backgroundColor: theme.surface
            }]}
            onPress={() => saveGroup(group)}
            activeOpacity={0.7}
          >
            <Text style={[styles.groupButtonText, { color: theme.primary }]}>{group}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDayPicker = () => (
    <View style={styles.dayPickerContainer}>
      <TouchableOpacity
        style={[
          styles.dayButton,
          { 
            borderColor: selectedDay === 'ALL' ? theme.primary : theme.border,
            backgroundColor: selectedDay === 'ALL' ? theme.primary : theme.surface
          }
        ]}
        onPress={() => setSelectedDay('ALL')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayButtonText,
          { color: selectedDay === 'ALL' ? '#ffffff' : theme.text }
        ]}>
          ALL
        </Text>
      </TouchableOpacity>
      
      {DAYS.map((day) => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            { 
              borderColor: selectedDay === day ? theme.primary : theme.border,
              backgroundColor: selectedDay === day ? theme.primary : theme.surface
            }
          ]}
          onPress={() => setSelectedDay(day)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayButtonText,
            { color: selectedDay === day ? '#ffffff' : theme.text }
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderClassItem = (classItem: ClassSchedule) => (
    <View key={`${classItem.Day}-${classItem.Time}-${classItem['Module Code']}`} 
          style={[styles.classItem, { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: isDarkMode ? '#000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
          }]}>
      <View style={styles.classHeader}>
        <Text style={[styles.classTime, { color: theme.primary }]}>{classItem.Time}</Text>
        <Text style={[styles.classType, { 
          color: theme.textSecondary,
          backgroundColor: theme.accent
        }]}>{classItem['Class Type']}</Text>
      </View>
      <Text style={[styles.moduleCode, { color: theme.text }]}>{classItem['Module Code']}</Text>
      <Text style={[styles.moduleTitle, { color: theme.text }]}>{classItem['Module Title']}</Text>
      <Text style={[styles.lecturer, { color: theme.textSecondary }]}>{classItem.Lecturer}</Text>
      <Text style={[styles.room, { color: theme.textSecondary }]}>{classItem.Room}</Text>
    </View>
  );

  const renderSchedule = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.background]}
        style={styles.headerGradient}
        locations={[0.6, 1]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.welcomeText, { color: '#ffffff' }]}>Hi Student! 👋</Text>
            <Text style={[styles.groupText, { color: '#ffffff' }]}>Group: {selectedGroup}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.themeButton, { borderColor: '#ffffff' }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeButtonText, { color: '#ffffff' }]}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.changeGroupButton, { borderColor: '#ffffff' }]}
              onPress={changeGroup}
              activeOpacity={0.7}
            >
              <Text style={[styles.changeGroupButtonText, { color: '#ffffff' }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
        {renderDayPicker()}
      </LinearGradient>
      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {selectedDay === 'ALL' ? (
          DAYS.map((day) => {
            const dayClasses = groupedByDay[day];
            if (!dayClasses || dayClasses.length === 0) return null;

            return (
              <View key={day} style={styles.daySection}>
                <Text style={[styles.dayTitle, { 
                  color: theme.text,
                  borderBottomColor: theme.primary
                }]}>{DAY_NAMES[day]}</Text>
                {dayClasses.map(renderClassItem)}
              </View>
            );
          })
        ) : (
          <View style={styles.daySection}>
            <Text style={[styles.dayTitle, { 
              color: theme.text,
              borderBottomColor: theme.primary
            }]}>{DAY_NAMES[selectedDay as DayOfWeek]}</Text>
            {groupedByDay[selectedDay]?.length > 0 ? (
              groupedByDay[selectedDay].map(renderClassItem)
            ) : (
              <View style={styles.noClassesContainer}>
                <Text style={[styles.noClassesText, { color: theme.textSecondary }]}>
                  No classes scheduled for this day
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={selectedGroup ? theme.primary : theme.background} 
      />
      {selectedGroup ? renderSchedule() : renderGroupSelection()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  groupContainer: {
    gap: 15,
    paddingHorizontal: 30,
  },
  groupButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  groupButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  header: {
    marginBottom: 10,
  },
  headerGradient: {
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  changeGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
  },
  changeGroupButtonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  dayPickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 8,
    borderWidth: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flex: 1,
  },
  daySection: {
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  classItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  classType: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moduleCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
  },
  lecturer: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  room: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
  },
  noClassesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noClassesText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupText: {
    fontSize: 16,
    
    fontWeight: '600',
    marginTop: 4,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    fontSize: 18,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
 
});
