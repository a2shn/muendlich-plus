export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      evaluation_types: {
        Row: {
          color: string
          id: string
          name: string
          order: number
          updated_at: number | null
          user_id: string
        }
        Insert: {
          color: string
          id: string
          name: string
          order: number
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          order?: number
          updated_at?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: number
          date: string
          id: string
          subject_id: string | null
          title: string
          topics: string | null
          type: string
          updated_at: number | null
          user_id: string
        }
        Insert: {
          created_at: number
          date: string
          id: string
          subject_id?: string | null
          title: string
          topics?: string | null
          type: string
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          created_at?: number
          date?: string
          id?: string
          subject_id?: string | null
          title?: string
          topics?: string | null
          type?: string
          updated_at?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exams_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      grade_reminder: {
        Row: {
          enabled: boolean | null
          frequency: number | null
          id: string | null
          last_shown: number | null
          next_reminder: number | null
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          frequency?: number | null
          id?: string | null
          last_shown?: number | null
          next_reminder?: number | null
          user_id?: string
        }
        Update: {
          enabled?: boolean | null
          frequency?: number | null
          id?: string | null
          last_shown?: number | null
          next_reminder?: number | null
          user_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          date: string
          evaluation_combination: string
          grade: number
          id: string
          note: string | null
          subject_id: string | null
          timestamp: number
          updated_at: number | null
          user_id: string
        }
        Insert: {
          date: string
          evaluation_combination: string
          grade: number
          id: string
          note?: string | null
          subject_id?: string | null
          timestamp: number
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          date?: string
          evaluation_combination?: string
          grade?: number
          id?: string
          note?: string | null
          subject_id?: string | null
          timestamp?: number
          updated_at?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'grades_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      participation_entries: {
        Row: {
          date: string
          evaluation_type_id: string | null
          id: string
          subject_id: string | null
          timestamp: number
          updated_at: number | null
          user_id: string
        }
        Insert: {
          date: string
          evaluation_type_id?: string | null
          id: string
          subject_id?: string | null
          timestamp: number
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          date?: string
          evaluation_type_id?: string | null
          id?: string
          subject_id?: string | null
          timestamp?: number
          updated_at?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'participation_entries_evaluation_type_id_fkey'
            columns: ['evaluation_type_id']
            isOneToOne: false
            referencedRelation: 'evaluation_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'participation_entries_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      schedule_slots: {
        Row: {
          created_at: number
          day_of_week: number
          id: string
          period: number
          subject_id: string | null
          updated_at: number | null
          user_id: string
          week_type: string | null
        }
        Insert: {
          created_at: number
          day_of_week: number
          id: string
          period: number
          subject_id?: string | null
          updated_at?: number | null
          user_id?: string
          week_type?: string | null
        }
        Update: {
          created_at?: number
          day_of_week?: number
          id?: string
          period?: number
          subject_id?: string | null
          updated_at?: number | null
          user_id?: string
          week_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_slots_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: number
          id: string
          name: string
          order: number
          target_grade: number | null
          updated_at: number | null
          user_id: string
        }
        Insert: {
          color: string
          created_at: number
          id: string
          name: string
          order: number
          target_grade?: number | null
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: number
          id?: string
          name?: string
          order?: number
          target_grade?: number | null
          updated_at?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: number
          due_date: string
          id: string
          subject_id: string | null
          title: string
          updated_at: number | null
          user_id: string
        }
        Insert: {
          created_at: number
          due_date: string
          id: string
          subject_id?: string | null
          title: string
          updated_at?: number | null
          user_id?: string
        }
        Update: {
          created_at?: number
          due_date?: string
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      user_settings: {
        Row: {
          auto_detect_location: boolean | null
          created_at: string | null
          federal_state: string | null
          grading_system: string | null
          id: string | null
          onboarding_completed: boolean | null
          user_id: string
        }
        Insert: {
          auto_detect_location?: boolean | null
          created_at?: string | null
          federal_state?: string | null
          grading_system?: string | null
          id?: string | null
          onboarding_completed?: boolean | null
          user_id?: string
        }
        Update: {
          auto_detect_location?: boolean | null
          created_at?: string | null
          federal_state?: string | null
          grading_system?: string | null
          id?: string | null
          onboarding_completed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      week_system_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string | null
          reference_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          reference_date?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          reference_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
