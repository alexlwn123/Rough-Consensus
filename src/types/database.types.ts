export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      debate_access: {
        Row: {
          created_at: string
          debate_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          debate_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          debate_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debate_access_debate_id_fkey"
            columns: ["debate_id"]
            isOneToOne: false
            referencedRelation: "debates"
            referencedColumns: ["id"]
          },
        ]
      }
      debates: {
        Row: {
          con_description: string | null
          created_at: string
          created_by: string | null
          current_phase: Database["public"]["Enums"]["Debate Phase"]
          description: string | null
          end_time: string | null
          id: string
          is_deleted: boolean
          motion: string | null
          pro_description: string | null
          start_time: string
          title: string
        }
        Insert: {
          con_description?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: Database["public"]["Enums"]["Debate Phase"]
          description?: string | null
          end_time?: string | null
          id?: string
          is_deleted?: boolean
          motion?: string | null
          pro_description?: string | null
          start_time?: string
          title: string
        }
        Update: {
          con_description?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: Database["public"]["Enums"]["Debate Phase"]
          description?: string | null
          end_time?: string | null
          id?: string
          is_deleted?: boolean
          motion?: string | null
          pro_description?: string | null
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          debate_id: string
          id: string
          post_vote: Json | null
          pre_vote: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          debate_id: string
          id?: string
          post_vote?: Json | null
          pre_vote?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          debate_id?: string
          id?: string
          post_vote?: Json | null
          pre_vote?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_debate_id_fkey"
            columns: ["debate_id"]
            isOneToOne: false
            referencedRelation: "debates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_debate_result_data: {
        Args: { debate_id: string }
        Returns: Database["public"]["CompositeTypes"]["debate_result"]
      }
      get_debate_sankey_data: {
        Args: { debate_id: string }
        Returns: Database["public"]["CompositeTypes"]["debate_sankey_data"]
      }
      get_debate_vote_counts: {
        Args: { debate_id: string }
        Returns: Database["public"]["CompositeTypes"]["debate_vote_counts"]
      }
      register_debate_access: {
        Args: { debate_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      "Debate Phase": "pre" | "post" | "scheduled" | "finished" | "ongoing"
    }
    CompositeTypes: {
      debate_result: {
        before:
          | Database["public"]["CompositeTypes"]["debate_result_before_after"]
          | null
        after:
          | Database["public"]["CompositeTypes"]["debate_result_before_after"]
          | null
        flows:
          | Database["public"]["CompositeTypes"]["debate_result_flows"]
          | null
      }
      debate_result_before_after: {
        pro: number | null
        against: number | null
        undecided: number | null
      }
      debate_result_flows: {
        protopro: number | null
        protoagainst: number | null
        protoundecided: number | null
        againsttopro: number | null
        againsttoagainst: number | null
        againsttoundecided: number | null
        undecidedtopro: number | null
        undecidedtoagainst: number | null
        undecidedtoundecided: number | null
      }
      debate_sankey_data: {
        nodes: Database["public"]["CompositeTypes"]["sankey_node"][] | null
        links: Database["public"]["CompositeTypes"]["sankey_link"][] | null
        current_phase: Database["public"]["Enums"]["Debate Phase"] | null
      }
      debate_vote_counts: {
        pre: Database["public"]["CompositeTypes"]["phase_counts"] | null
        post: Database["public"]["CompositeTypes"]["phase_counts"] | null
        total_voters: number | null
        current_phase: Database["public"]["Enums"]["Debate Phase"] | null
      }
      phase_counts: {
        for: number | null
        against: number | null
        undecided: number | null
      }
      sankey_link: {
        source: number | null
        target: number | null
        value: number | null
      }
      sankey_node: {
        name: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      "Debate Phase": ["pre", "post", "scheduled", "finished", "ongoing"],
    },
  },
} as const
