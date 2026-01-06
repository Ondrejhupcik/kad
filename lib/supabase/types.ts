export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          duration_minutes: number;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          duration_minutes: number;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          duration_minutes?: number;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          profile_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          profile_id: string;
          service_id: string;
          client_name: string;
          client_phone: string;
          client_email: string | null;
          start_time: string;
          end_time: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          service_id: string;
          client_name: string;
          client_phone: string;
          client_email?: string | null;
          start_time: string;
          end_time: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          service_id?: string;
          client_name?: string;
          client_phone?: string;
          client_email?: string | null;
          start_time?: string;
          end_time?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
