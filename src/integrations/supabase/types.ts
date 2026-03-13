export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at: string
          details: Json | null
          id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_actions: {
        Row: {
          action_payload: Json | null
          action_result: Json | null
          action_type: Database["public"]["Enums"]["agent_action_type_enum"]
          agent_id: string
          approved_by_user: boolean
          confidence: number | null
          created_at: string
          id: string
          product_id: string | null
          workspace_id: string
        }
        Insert: {
          action_payload?: Json | null
          action_result?: Json | null
          action_type: Database["public"]["Enums"]["agent_action_type_enum"]
          agent_id: string
          approved_by_user?: boolean
          confidence?: number | null
          created_at?: string
          id?: string
          product_id?: string | null
          workspace_id: string
        }
        Update: {
          action_payload?: Json | null
          action_result?: Json | null
          action_type?: Database["public"]["Enums"]["agent_action_type_enum"]
          agent_id?: string
          approved_by_user?: boolean
          confidence?: number | null
          created_at?: string
          id?: string
          product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "catalog_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_decision_memory: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          approved: boolean
          confidence: number | null
          created_at: string
          decision_action: Json | null
          decision_context: Json | null
          id: string
          workspace_id: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          approved?: boolean
          confidence?: number | null
          created_at?: string
          decision_action?: Json | null
          decision_context?: Json | null
          id?: string
          workspace_id: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type_enum"]
          approved?: boolean
          confidence?: number | null
          created_at?: string
          decision_action?: Json | null
          decision_context?: Json | null
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_decision_memory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_policies: {
        Row: {
          actions: Json | null
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          conditions: Json | null
          created_at: string
          id: string
          policy_name: string
          requires_approval: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actions?: Json | null
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          conditions?: Json | null
          created_at?: string
          id?: string
          policy_name: string
          requires_approval?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actions?: Json | null
          agent_type?: Database["public"]["Enums"]["agent_type_enum"]
          conditions?: Json | null
          created_at?: string
          id?: string
          policy_name?: string
          requires_approval?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedules: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          last_run: string | null
          schedule_config: Json | null
          schedule_type: Database["public"]["Enums"]["agent_schedule_enum"]
          workspace_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          last_run?: string | null
          schedule_config?: Json | null
          schedule_type?: Database["public"]["Enums"]["agent_schedule_enum"]
          workspace_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          last_run?: string | null
          schedule_config?: Json | null
          schedule_type?: Database["public"]["Enums"]["agent_schedule_enum"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "catalog_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          priority: number
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["agent_task_status_enum"]
          task_type: string | null
          workspace_id: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status_enum"]
          task_type?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          priority?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status_enum"]
          task_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "catalog_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_library: {
        Row: {
          ai_alt_text: string | null
          ai_tags: string[] | null
          asset_type: Database["public"]["Enums"]["asset_type_enum"]
          background_type: Database["public"]["Enums"]["background_enum"] | null
          created_at: string
          family_shared: boolean
          file_hash: string | null
          file_size: number | null
          format: string | null
          generation_prompt: string | null
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          parent_asset_id: string | null
          processing_job_id: string | null
          provider: string | null
          public_url: string | null
          quality_score: number | null
          review_status: Database["public"]["Enums"]["asset_review_status_enum"]
          source_kind: Database["public"]["Enums"]["asset_source_enum"]
          status: Database["public"]["Enums"]["asset_status_enum"]
          storage_path: string | null
          updated_at: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          ai_alt_text?: string | null
          ai_tags?: string[] | null
          asset_type?: Database["public"]["Enums"]["asset_type_enum"]
          background_type?:
            | Database["public"]["Enums"]["background_enum"]
            | null
          created_at?: string
          family_shared?: boolean
          file_hash?: string | null
          file_size?: number | null
          format?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          parent_asset_id?: string | null
          processing_job_id?: string | null
          provider?: string | null
          public_url?: string | null
          quality_score?: number | null
          review_status?: Database["public"]["Enums"]["asset_review_status_enum"]
          source_kind?: Database["public"]["Enums"]["asset_source_enum"]
          status?: Database["public"]["Enums"]["asset_status_enum"]
          storage_path?: string | null
          updated_at?: string
          width?: number | null
          workspace_id: string
        }
        Update: {
          ai_alt_text?: string | null
          ai_tags?: string[] | null
          asset_type?: Database["public"]["Enums"]["asset_type_enum"]
          background_type?:
            | Database["public"]["Enums"]["background_enum"]
            | null
          created_at?: string
          family_shared?: boolean
          file_hash?: string | null
          file_size?: number | null
          format?: string | null
          generation_prompt?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          parent_asset_id?: string | null
          processing_job_id?: string | null
          provider?: string | null
          public_url?: string | null
          quality_score?: number | null
          review_status?: Database["public"]["Enums"]["asset_review_status_enum"]
          source_kind?: Database["public"]["Enums"]["asset_source_enum"]
          status?: Database["public"]["Enums"]["asset_status_enum"]
          storage_path?: string | null
          updated_at?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_library_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "asset_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_library_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "image_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_library_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_product_links: {
        Row: {
          asset_id: string
          channel_id: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          usage_context: Database["public"]["Enums"]["asset_usage_enum"]
        }
        Insert: {
          asset_id: string
          channel_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          usage_context?: Database["public"]["Enums"]["asset_usage_enum"]
        }
        Update: {
          asset_id?: string
          channel_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          usage_context?: Database["public"]["Enums"]["asset_usage_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "asset_product_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_variants: {
        Row: {
          channel_id: string | null
          created_at: string
          format: string | null
          height: number | null
          id: string
          public_url: string | null
          source_asset_id: string
          storage_path: string | null
          variant_type: Database["public"]["Enums"]["asset_variant_enum"]
          width: number | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          format?: string | null
          height?: number | null
          id?: string
          public_url?: string | null
          source_asset_id: string
          storage_path?: string | null
          variant_type: Database["public"]["Enums"]["asset_variant_enum"]
          width?: number | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          format?: string | null
          height?: number | null
          id?: string
          public_url?: string | null
          source_asset_id?: string
          storage_path?: string | null
          variant_type?: Database["public"]["Enums"]["asset_variant_enum"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_variants_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "asset_library"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_completeness_scores: {
        Row: {
          category_id: string | null
          completeness_score: number | null
          created_at: string | null
          id: string
          present_attributes: number | null
          product_id: string | null
          required_attributes: number | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          completeness_score?: number | null
          created_at?: string | null
          id?: string
          present_attributes?: number | null
          product_id?: string | null
          required_attributes?: number | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          completeness_score?: number | null
          created_at?: string | null
          id?: string
          present_attributes?: number | null
          product_id?: string | null
          required_attributes?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_completeness_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_completeness_scores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["audit_entity_type"]
          field_changes: Json | null
          id: string
          metadata: Json | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["audit_entity_type"]
          field_changes?: Json | null
          id?: string
          metadata?: Json | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["audit_entity_type"]
          field_changes?: Json | null
          id?: string
          metadata?: Json | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_actions: {
        Row: {
          action_payload: Json | null
          action_type: Database["public"]["Enums"]["autonomous_action_type"]
          confidence: number | null
          created_at: string
          executed_at: string | null
          execution_mode: Database["public"]["Enums"]["autonomous_execution_mode"]
          expected_conversion: number | null
          expected_revenue: number | null
          id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["autonomous_action_status"]
          target_category_id: string | null
          target_channel_id: string | null
          target_product_id: string | null
          workspace_id: string
        }
        Insert: {
          action_payload?: Json | null
          action_type: Database["public"]["Enums"]["autonomous_action_type"]
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          execution_mode?: Database["public"]["Enums"]["autonomous_execution_mode"]
          expected_conversion?: number | null
          expected_revenue?: number | null
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["autonomous_action_status"]
          target_category_id?: string | null
          target_channel_id?: string | null
          target_product_id?: string | null
          workspace_id: string
        }
        Update: {
          action_payload?: Json | null
          action_type?: Database["public"]["Enums"]["autonomous_action_type"]
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          execution_mode?: Database["public"]["Enums"]["autonomous_execution_mode"]
          expected_conversion?: number | null
          expected_revenue?: number | null
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["autonomous_action_status"]
          target_category_id?: string | null
          target_channel_id?: string | null
          target_product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_execution_logs: {
        Row: {
          action_id: string
          duration_ms: number | null
          error_payload: Json | null
          executed_at: string
          execution_result: Json | null
          id: string
          workspace_id: string
        }
        Insert: {
          action_id: string
          duration_ms?: number | null
          error_payload?: Json | null
          executed_at?: string
          execution_result?: Json | null
          id?: string
          workspace_id: string
        }
        Update: {
          action_id?: string
          duration_ms?: number | null
          error_payload?: Json | null
          executed_at?: string
          execution_result?: Json | null
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_execution_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "autonomous_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_execution_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_guardrails: {
        Row: {
          created_at: string
          guardrail_type: string
          id: string
          is_active: boolean
          rule_payload: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          guardrail_type?: string
          id?: string
          is_active?: boolean
          rule_payload?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          guardrail_type?: string
          id?: string
          is_active?: boolean
          rule_payload?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_guardrails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_decision_policies: {
        Row: {
          allowed_actions: Json | null
          conditions: Json | null
          created_at: string | null
          id: string
          policy_name: string
          requires_human_review: boolean | null
          workspace_id: string
        }
        Insert: {
          allowed_actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          policy_name: string
          requires_human_review?: boolean | null
          workspace_id: string
        }
        Update: {
          allowed_actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          policy_name?: string
          requires_human_review?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_decision_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_policy_adjustments: {
        Row: {
          adjustment_reason: string | null
          confidence: number | null
          created_at: string | null
          id: string
          new_configuration: Json | null
          old_configuration: Json | null
          policy_id: string | null
          workspace_id: string
        }
        Insert: {
          adjustment_reason?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          new_configuration?: Json | null
          old_configuration?: Json | null
          policy_id?: string | null
          workspace_id: string
        }
        Update: {
          adjustment_reason?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          new_configuration?: Json | null
          old_configuration?: Json | null
          policy_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_policy_adjustments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "brain_decision_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_policy_adjustments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_recommendations: {
        Row: {
          bundle_products: Json | null
          confidence: number | null
          created_at: string | null
          expected_conversion: number | null
          expected_revenue: number | null
          id: string
          workspace_id: string
        }
        Insert: {
          bundle_products?: Json | null
          confidence?: number | null
          created_at?: string | null
          expected_conversion?: number | null
          expected_revenue?: number | null
          id?: string
          workspace_id: string
        }
        Update: {
          bundle_products?: Json | null
          confidence?: number | null
          created_at?: string | null
          expected_conversion?: number | null
          expected_revenue?: number | null
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_suggestions: {
        Row: {
          accepted: boolean | null
          bundle_reason: string | null
          bundle_type: Database["public"]["Enums"]["bundle_type_enum"]
          confidence: number | null
          created_at: string | null
          id: string
          primary_product_id: string | null
          suggested_products: string[] | null
          workspace_id: string
        }
        Insert: {
          accepted?: boolean | null
          bundle_reason?: string | null
          bundle_type: Database["public"]["Enums"]["bundle_type_enum"]
          confidence?: number | null
          created_at?: string | null
          id?: string
          primary_product_id?: string | null
          suggested_products?: string[] | null
          workspace_id: string
        }
        Update: {
          accepted?: boolean | null
          bundle_reason?: string | null
          bundle_type?: Database["public"]["Enums"]["bundle_type_enum"]
          confidence?: number | null
          created_at?: string | null
          id?: string
          primary_product_id?: string | null
          suggested_products?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_suggestions_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_action_simulations: {
        Row: {
          created_at: string | null
          decision_id: string | null
          expected_value: number | null
          id: string
          recommended: boolean | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          simulation_run_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          decision_id?: string | null
          expected_value?: number | null
          id?: string
          recommended?: boolean | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          simulation_run_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          decision_id?: string | null
          expected_value?: number | null
          id?: string
          recommended?: boolean | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          simulation_run_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_action_simulations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "catalog_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_action_simulations_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "catalog_simulation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_action_simulations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_agents: {
        Row: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          configuration: Json | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["agent_status_enum"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type_enum"]
          configuration?: Json | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["agent_status_enum"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_name?: string
          agent_type?: Database["public"]["Enums"]["agent_type_enum"]
          configuration?: Json | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["agent_status_enum"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_entities: {
        Row: {
          canonical_label: string | null
          created_at: string
          embedding: Json | null
          entity_id: string
          entity_label: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"]
          id: string
          metadata: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          canonical_label?: string | null
          created_at?: string
          embedding?: Json | null
          entity_id: string
          entity_label?: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"]
          id?: string
          metadata?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          canonical_label?: string | null
          created_at?: string
          embedding?: Json | null
          entity_id?: string
          entity_label?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"]
          id?: string
          metadata?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_observations: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          id: string
          observation_type: Database["public"]["Enums"]["brain_observation_type"]
          processed: boolean
          product_id: string | null
          severity: number | null
          signal_payload: Json | null
          signal_source: string | null
          signal_strength: number | null
          source: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          observation_type: Database["public"]["Enums"]["brain_observation_type"]
          processed?: boolean
          product_id?: string | null
          severity?: number | null
          signal_payload?: Json | null
          signal_source?: string | null
          signal_strength?: number | null
          source?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          observation_type?: Database["public"]["Enums"]["brain_observation_type"]
          processed?: boolean
          product_id?: string | null
          severity?: number | null
          signal_payload?: Json | null
          signal_source?: string | null
          signal_strength?: number | null
          source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_observations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_outcomes: {
        Row: {
          baseline_value: number | null
          created_at: string
          delta: number | null
          feedback_human: string | null
          feedback_rating: number | null
          final_value: number | null
          id: string
          impact_score: number | null
          measured_at: string | null
          metrics_after: Json | null
          metrics_before: Json | null
          outcome_type: Database["public"]["Enums"]["brain_outcome_type"]
          plan_id: string | null
          product_id: string | null
          step_id: string | null
          workspace_id: string
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string
          delta?: number | null
          feedback_human?: string | null
          feedback_rating?: number | null
          final_value?: number | null
          id?: string
          impact_score?: number | null
          measured_at?: string | null
          metrics_after?: Json | null
          metrics_before?: Json | null
          outcome_type?: Database["public"]["Enums"]["brain_outcome_type"]
          plan_id?: string | null
          product_id?: string | null
          step_id?: string | null
          workspace_id: string
        }
        Update: {
          baseline_value?: number | null
          created_at?: string
          delta?: number | null
          feedback_human?: string | null
          feedback_rating?: number | null
          final_value?: number | null
          id?: string
          impact_score?: number | null
          measured_at?: string | null
          metrics_after?: Json | null
          metrics_before?: Json | null
          outcome_type?: Database["public"]["Enums"]["brain_outcome_type"]
          plan_id?: string | null
          product_id?: string | null
          step_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_outcomes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_outcomes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_outcomes_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plan_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_outcomes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_plan_steps: {
        Row: {
          agent_id: string | null
          assigned_agent_type: string | null
          completed_at: string | null
          confidence: number | null
          depends_on: string[] | null
          depends_on_step_id: string | null
          error_message: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          plan_id: string
          product_id: string | null
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["brain_step_status"]
          step_description: string | null
          step_order: number
          step_type: string
        }
        Insert: {
          agent_id?: string | null
          assigned_agent_type?: string | null
          completed_at?: string | null
          confidence?: number | null
          depends_on?: string[] | null
          depends_on_step_id?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          plan_id: string
          product_id?: string | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["brain_step_status"]
          step_description?: string | null
          step_order?: number
          step_type: string
        }
        Update: {
          agent_id?: string | null
          assigned_agent_type?: string | null
          completed_at?: string | null
          confidence?: number | null
          depends_on?: string[] | null
          depends_on_step_id?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          plan_id?: string
          product_id?: string | null
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["brain_step_status"]
          step_description?: string | null
          step_order?: number
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_plan_steps_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "catalog_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_plan_steps_depends_on_step_id_fkey"
            columns: ["depends_on_step_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plan_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_plan_steps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_plans: {
        Row: {
          approved_by: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string
          created_by: string | null
          estimated_impact: Json | null
          id: string
          objective: string | null
          plan_description: string | null
          plan_name: string
          policy_checks: Json | null
          priority: number | null
          priority_score: number | null
          requires_approval: boolean
          started_at: string | null
          status: Database["public"]["Enums"]["brain_plan_status"]
          target_entity_id: string | null
          target_entity_type:
            | Database["public"]["Enums"]["brain_entity_type"]
            | null
          workspace_id: string
        }
        Insert: {
          approved_by?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          estimated_impact?: Json | null
          id?: string
          objective?: string | null
          plan_description?: string | null
          plan_name: string
          policy_checks?: Json | null
          priority?: number | null
          priority_score?: number | null
          requires_approval?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["brain_plan_status"]
          target_entity_id?: string | null
          target_entity_type?:
            | Database["public"]["Enums"]["brain_entity_type"]
            | null
          workspace_id: string
        }
        Update: {
          approved_by?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          estimated_impact?: Json | null
          id?: string
          objective?: string | null
          plan_description?: string | null
          plan_name?: string
          policy_checks?: Json | null
          priority?: number | null
          priority_score?: number | null
          requires_approval?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["brain_plan_status"]
          target_entity_id?: string | null
          target_entity_type?:
            | Database["public"]["Enums"]["brain_entity_type"]
            | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_brain_relations: {
        Row: {
          confidence: number | null
          created_at: string
          from_entity_id: string | null
          id: string
          metadata: Json | null
          relation_type: Database["public"]["Enums"]["brain_relation_type"]
          source: string | null
          source_entity_id: string
          target_entity_id: string
          to_entity_id: string | null
          weight: number | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          from_entity_id?: string | null
          id?: string
          metadata?: Json | null
          relation_type: Database["public"]["Enums"]["brain_relation_type"]
          source?: string | null
          source_entity_id: string
          target_entity_id: string
          to_entity_id?: string | null
          weight?: number | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          from_entity_id?: string | null
          id?: string
          metadata?: Json | null
          relation_type?: Database["public"]["Enums"]["brain_relation_type"]
          source?: string | null
          source_entity_id?: string
          target_entity_id?: string
          to_entity_id?: string | null
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_brain_relations_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_relations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_brain_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_clusters: {
        Row: {
          centroid: Json | null
          cluster_description: string | null
          cluster_name: string
          cluster_type: Database["public"]["Enums"]["brain_cluster_type"]
          created_at: string
          description: string | null
          id: string
          metrics: Json | null
          product_ids: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          centroid?: Json | null
          cluster_description?: string | null
          cluster_name: string
          cluster_type: Database["public"]["Enums"]["brain_cluster_type"]
          created_at?: string
          description?: string | null
          id?: string
          metrics?: Json | null
          product_ids?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          centroid?: Json | null
          cluster_description?: string | null
          cluster_name?: string
          cluster_type?: Database["public"]["Enums"]["brain_cluster_type"]
          created_at?: string
          description?: string | null
          id?: string
          metrics?: Json | null
          product_ids?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_clusters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_decision_signals: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          id: string
          payload: Json | null
          severity: number | null
          signal_type: Database["public"]["Enums"]["decision_signal_type"]
          source: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          payload?: Json | null
          severity?: number | null
          signal_type: Database["public"]["Enums"]["decision_signal_type"]
          source?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          payload?: Json | null
          severity?: number | null
          signal_type?: Database["public"]["Enums"]["decision_signal_type"]
          source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_decision_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_decisions: {
        Row: {
          confidence: number | null
          created_at: string | null
          decision_context: Json | null
          decision_type: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          id: string
          impact_score: number | null
          priority_level:
            | Database["public"]["Enums"]["decision_priority_level"]
            | null
          priority_score: number | null
          status: Database["public"]["Enums"]["decision_status"] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          decision_context?: Json | null
          decision_type?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          impact_score?: number | null
          priority_level?:
            | Database["public"]["Enums"]["decision_priority_level"]
            | null
          priority_score?: number | null
          status?: Database["public"]["Enums"]["decision_status"] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          decision_context?: Json | null
          decision_type?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          impact_score?: number | null
          priority_level?:
            | Database["public"]["Enums"]["decision_priority_level"]
            | null
          priority_score?: number | null
          status?: Database["public"]["Enums"]["decision_status"] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_economic_models: {
        Row: {
          created_at: string | null
          formula: string | null
          id: string
          model_name: string
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          formula?: string | null
          id?: string
          model_name: string
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          formula?: string | null
          id?: string
          model_name?: string
          variables?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_economic_models_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_expected_value_models: {
        Row: {
          created_at: string | null
          formula: string | null
          id: string
          model_name: string
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          formula?: string | null
          id?: string
          model_name: string
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          formula?: string | null
          id?: string
          model_name?: string
          variables?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_expected_value_models_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_gap_analysis: {
        Row: {
          category_id: string | null
          confidence: number | null
          created_at: string | null
          gap_description: string | null
          gap_type: Database["public"]["Enums"]["gap_type_enum"]
          id: string
          suggested_products: Json | null
          supplier_id: string | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          confidence?: number | null
          created_at?: string | null
          gap_description?: string | null
          gap_type: Database["public"]["Enums"]["gap_type_enum"]
          id?: string
          suggested_products?: Json | null
          supplier_id?: string | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          confidence?: number | null
          created_at?: string | null
          gap_description?: string | null
          gap_type?: Database["public"]["Enums"]["gap_type_enum"]
          id?: string
          suggested_products?: Json | null
          supplier_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_gap_analysis_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_impact_evaluations: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          id: string
          impact_dimension: Database["public"]["Enums"]["impact_dimension"]
          impact_score: number | null
          metadata: Json | null
          signal_id: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          impact_dimension: Database["public"]["Enums"]["impact_dimension"]
          impact_score?: number | null
          metadata?: Json | null
          signal_id?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          impact_dimension?: Database["public"]["Enums"]["impact_dimension"]
          impact_score?: number | null
          metadata?: Json | null
          signal_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_impact_evaluations_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "catalog_decision_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_impact_evaluations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_learning_models: {
        Row: {
          created_at: string | null
          id: string
          last_trained_at: string | null
          model_parameters: Json | null
          model_type: Database["public"]["Enums"]["learning_model_type"]
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_trained_at?: string | null
          model_parameters?: Json | null
          model_type: Database["public"]["Enums"]["learning_model_type"]
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_trained_at?: string | null
          model_parameters?: Json | null
          model_type?: Database["public"]["Enums"]["learning_model_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_learning_models_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_learning_signals: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          feedback_type: Database["public"]["Enums"]["learning_feedback_type"]
          id: string
          metadata: Json | null
          signal_strength: number | null
          signal_type: Database["public"]["Enums"]["learning_signal_type"]
          source: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          feedback_type?: Database["public"]["Enums"]["learning_feedback_type"]
          id?: string
          metadata?: Json | null
          signal_strength?: number | null
          signal_type: Database["public"]["Enums"]["learning_signal_type"]
          source?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          feedback_type?: Database["public"]["Enums"]["learning_feedback_type"]
          id?: string
          metadata?: Json | null
          signal_strength?: number | null
          signal_type?: Database["public"]["Enums"]["learning_signal_type"]
          source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_learning_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_outcome_tracking: {
        Row: {
          baseline_value: number | null
          confidence: number | null
          delta: number | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          id: string
          measured_at: string | null
          metadata: Json | null
          metric_type:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          new_value: number | null
          plan_id: string | null
          workspace_id: string
        }
        Insert: {
          baseline_value?: number | null
          confidence?: number | null
          delta?: number | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_type?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          new_value?: number | null
          plan_id?: string | null
          workspace_id: string
        }
        Update: {
          baseline_value?: number | null
          confidence?: number | null
          delta?: number | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_type?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          new_value?: number | null
          plan_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_outcome_tracking_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_outcome_tracking_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_reinforcement_memory: {
        Row: {
          action_taken: string | null
          confidence: number | null
          context_features: Json | null
          created_at: string | null
          decision_type: string | null
          id: string
          reward: number | null
          workspace_id: string
        }
        Insert: {
          action_taken?: string | null
          confidence?: number | null
          context_features?: Json | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          reward?: number | null
          workspace_id: string
        }
        Update: {
          action_taken?: string | null
          confidence?: number | null
          context_features?: Json | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          reward?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_reinforcement_memory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_simulation_results: {
        Row: {
          baseline_value: number | null
          confidence: number | null
          created_at: string | null
          delta: number | null
          id: string
          metric_type: Database["public"]["Enums"]["brain_outcome_type"] | null
          predicted_value: number | null
          result_type:
            | Database["public"]["Enums"]["simulation_result_type"]
            | null
          simulation_run_id: string
        }
        Insert: {
          baseline_value?: number | null
          confidence?: number | null
          created_at?: string | null
          delta?: number | null
          id?: string
          metric_type?: Database["public"]["Enums"]["brain_outcome_type"] | null
          predicted_value?: number | null
          result_type?:
            | Database["public"]["Enums"]["simulation_result_type"]
            | null
          simulation_run_id: string
        }
        Update: {
          baseline_value?: number | null
          confidence?: number | null
          created_at?: string | null
          delta?: number | null
          id?: string
          metric_type?: Database["public"]["Enums"]["brain_outcome_type"] | null
          predicted_value?: number | null
          result_type?:
            | Database["public"]["Enums"]["simulation_result_type"]
            | null
          simulation_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_simulation_results_simulation_run_id_fkey"
            columns: ["simulation_run_id"]
            isOneToOne: false
            referencedRelation: "catalog_simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_simulation_runs: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string | null
          id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          scenario_id: string | null
          simulation_output: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["simulation_status"] | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scenario_id?: string | null
          simulation_output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"] | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          scenario_id?: string | null
          simulation_output?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_simulation_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "catalog_simulation_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_simulation_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_simulation_scenarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["brain_entity_type"] | null
          expected_changes: Json | null
          id: string
          input_data: Json | null
          scenario_name: string
          simulation_type: Database["public"]["Enums"]["simulation_type"]
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          expected_changes?: Json | null
          id?: string
          input_data?: Json | null
          scenario_name: string
          simulation_type: Database["public"]["Enums"]["simulation_type"]
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["brain_entity_type"] | null
          expected_changes?: Json | null
          id?: string
          input_data?: Json | null
          scenario_name?: string
          simulation_type?: Database["public"]["Enums"]["simulation_type"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_simulation_scenarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_actions: {
        Row: {
          action_payload: Json | null
          action_type: string | null
          created_at: string | null
          id: string
          scenario_id: string
          target_entity_id: string | null
          target_entity_type:
            | Database["public"]["Enums"]["twin_entity_type"]
            | null
        }
        Insert: {
          action_payload?: Json | null
          action_type?: string | null
          created_at?: string | null
          id?: string
          scenario_id: string
          target_entity_id?: string | null
          target_entity_type?:
            | Database["public"]["Enums"]["twin_entity_type"]
            | null
        }
        Update: {
          action_payload?: Json | null
          action_type?: string | null
          created_at?: string | null
          id?: string
          scenario_id?: string
          target_entity_id?: string | null
          target_entity_type?:
            | Database["public"]["Enums"]["twin_entity_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "catalog_twin_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_comparisons: {
        Row: {
          comparison_result: Json | null
          confidence: number | null
          created_at: string | null
          id: string
          recommended_scenario: string | null
          scenario_a_id: string | null
          scenario_b_id: string | null
          twin_id: string
        }
        Insert: {
          comparison_result?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          recommended_scenario?: string | null
          scenario_a_id?: string | null
          scenario_b_id?: string | null
          twin_id: string
        }
        Update: {
          comparison_result?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          recommended_scenario?: string | null
          scenario_a_id?: string | null
          scenario_b_id?: string | null
          twin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_comparisons_twin_id_fkey"
            columns: ["twin_id"]
            isOneToOne: false
            referencedRelation: "catalog_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_entities: {
        Row: {
          canonical_data: Json | null
          channel_data: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["twin_entity_type"] | null
          id: string
          metadata: Json | null
          twin_id: string
        }
        Insert: {
          canonical_data?: Json | null
          channel_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["twin_entity_type"] | null
          id?: string
          metadata?: Json | null
          twin_id: string
        }
        Update: {
          canonical_data?: Json | null
          channel_data?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["twin_entity_type"] | null
          id?: string
          metadata?: Json | null
          twin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_entities_twin_id_fkey"
            columns: ["twin_id"]
            isOneToOne: false
            referencedRelation: "catalog_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_relations: {
        Row: {
          created_at: string | null
          from_entity_id: string | null
          id: string
          metadata: Json | null
          relation_type: string | null
          to_entity_id: string | null
          twin_id: string
        }
        Insert: {
          created_at?: string | null
          from_entity_id?: string | null
          id?: string
          metadata?: Json | null
          relation_type?: string | null
          to_entity_id?: string | null
          twin_id: string
        }
        Update: {
          created_at?: string | null
          from_entity_id?: string | null
          id?: string
          metadata?: Json | null
          relation_type?: string | null
          to_entity_id?: string | null
          twin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_relations_twin_id_fkey"
            columns: ["twin_id"]
            isOneToOne: false
            referencedRelation: "catalog_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_results: {
        Row: {
          baseline_value: number | null
          confidence: number | null
          created_at: string | null
          delta: number | null
          id: string
          metadata: Json | null
          metric_type:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          predicted_value: number | null
          result_type: Database["public"]["Enums"]["twin_result_type"] | null
          scenario_id: string
        }
        Insert: {
          baseline_value?: number | null
          confidence?: number | null
          created_at?: string | null
          delta?: number | null
          id?: string
          metadata?: Json | null
          metric_type?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          predicted_value?: number | null
          result_type?: Database["public"]["Enums"]["twin_result_type"] | null
          scenario_id: string
        }
        Update: {
          baseline_value?: number | null
          confidence?: number | null
          created_at?: string | null
          delta?: number | null
          id?: string
          metadata?: Json | null
          metric_type?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          predicted_value?: number | null
          result_type?: Database["public"]["Enums"]["twin_result_type"] | null
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "catalog_twin_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_scenarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          input_parameters: Json | null
          scenario_name: string | null
          scenario_type:
            | Database["public"]["Enums"]["twin_scenario_type"]
            | null
          status: Database["public"]["Enums"]["twin_scenario_status"] | null
          twin_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_parameters?: Json | null
          scenario_name?: string | null
          scenario_type?:
            | Database["public"]["Enums"]["twin_scenario_type"]
            | null
          status?: Database["public"]["Enums"]["twin_scenario_status"] | null
          twin_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_parameters?: Json | null
          scenario_name?: string | null
          scenario_type?:
            | Database["public"]["Enums"]["twin_scenario_type"]
            | null
          status?: Database["public"]["Enums"]["twin_scenario_status"] | null
          twin_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_scenarios_twin_id_fkey"
            columns: ["twin_id"]
            isOneToOne: false
            referencedRelation: "catalog_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twin_snapshots: {
        Row: {
          created_at: string | null
          id: string
          snapshot_metadata: Json | null
          snapshot_name: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          snapshot_metadata?: Json | null
          snapshot_name?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          snapshot_metadata?: Json | null
          snapshot_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twin_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_twins: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          source_snapshot_id: string | null
          twin_name: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          source_snapshot_id?: string | null
          twin_name?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          source_snapshot_id?: string | null
          twin_name?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_twins_source_snapshot_id_fkey"
            columns: ["source_snapshot_id"]
            isOneToOne: false
            referencedRelation: "catalog_twin_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_twins_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
          woocommerce_id: number | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
          woocommerce_id?: number | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
          woocommerce_id?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      category_schemas: {
        Row: {
          category_id: string | null
          channel_overrides: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          optional_fields: string[]
          required_fields: string[]
          schema_definition: Json
          updated_at: string
          variation_attributes: Json
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          channel_overrides?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          optional_fields?: string[]
          required_fields?: string[]
          schema_definition?: Json
          updated_at?: string
          variation_attributes?: Json
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          channel_overrides?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          optional_fields?: string[]
          required_fields?: string[]
          schema_definition?: Json
          updated_at?: string
          variation_attributes?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_schemas_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_schemas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_attribute_mappings: {
        Row: {
          attribute_name: string
          channel_attribute_name: string
          channel_id: string
          created_at: string | null
          id: string
          required: boolean | null
          transformation_rules: Json | null
          workspace_id: string
        }
        Insert: {
          attribute_name: string
          channel_attribute_name: string
          channel_id: string
          created_at?: string | null
          id?: string
          required?: boolean | null
          transformation_rules?: Json | null
          workspace_id: string
        }
        Update: {
          attribute_name?: string
          channel_attribute_name?: string
          channel_id?: string
          created_at?: string | null
          id?: string
          required?: boolean | null
          transformation_rules?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_attribute_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_attribute_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_category_mappings: {
        Row: {
          channel_category: string | null
          channel_id: string
          confidence: number | null
          created_at: string | null
          id: string
          internal_category: string | null
          workspace_id: string
        }
        Insert: {
          channel_category?: string | null
          channel_id: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          internal_category?: string | null
          workspace_id: string
        }
        Update: {
          channel_category?: string | null
          channel_id?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          internal_category?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_category_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_category_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connections: {
        Row: {
          channel_id: string
          connection_name: string | null
          created_at: string | null
          credentials: Json | null
          id: string
          last_sync_at: string | null
          settings: Json | null
          status: string | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          connection_name?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          connection_name?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_connections_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_feed_profiles: {
        Row: {
          attribute_blacklist: string[] | null
          attribute_whitelist: string[] | null
          channel_id: string
          created_at: string | null
          currency: string | null
          description_template: string | null
          feed_type: Database["public"]["Enums"]["feed_type_enum"] | null
          id: string
          image_strategy: Json | null
          is_default: boolean | null
          locale: string | null
          price_strategy: Json | null
          profile_name: string
          title_template: string | null
          updated_at: string | null
          validation_profile: Json | null
          workspace_id: string
        }
        Insert: {
          attribute_blacklist?: string[] | null
          attribute_whitelist?: string[] | null
          channel_id: string
          created_at?: string | null
          currency?: string | null
          description_template?: string | null
          feed_type?: Database["public"]["Enums"]["feed_type_enum"] | null
          id?: string
          image_strategy?: Json | null
          is_default?: boolean | null
          locale?: string | null
          price_strategy?: Json | null
          profile_name: string
          title_template?: string | null
          updated_at?: string | null
          validation_profile?: Json | null
          workspace_id: string
        }
        Update: {
          attribute_blacklist?: string[] | null
          attribute_whitelist?: string[] | null
          channel_id?: string
          created_at?: string | null
          currency?: string | null
          description_template?: string | null
          feed_type?: Database["public"]["Enums"]["feed_type_enum"] | null
          id?: string
          image_strategy?: Json | null
          is_default?: boolean | null
          locale?: string | null
          price_strategy?: Json | null
          profile_name?: string
          title_template?: string | null
          updated_at?: string | null
          validation_profile?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_feed_profiles_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_feed_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_field_mappings: {
        Row: {
          canonical_field: string
          channel_field: string
          channel_id: string
          created_at: string | null
          id: string
          required: boolean | null
          transformation_rules: Json | null
          workspace_id: string
        }
        Insert: {
          canonical_field: string
          channel_field: string
          channel_id: string
          created_at?: string | null
          id?: string
          required?: boolean | null
          transformation_rules?: Json | null
          workspace_id: string
        }
        Update: {
          canonical_field?: string
          channel_field?: string
          channel_id?: string
          created_at?: string | null
          id?: string
          required?: boolean | null
          transformation_rules?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_field_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_field_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_performance_predictions: {
        Row: {
          channel_id: string | null
          confidence: number | null
          created_at: string | null
          id: string
          predicted_conversion: number | null
          predicted_ctr: number | null
          predicted_revenue: number | null
          product_id: string | null
          workspace_id: string
        }
        Insert: {
          channel_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          predicted_conversion?: number | null
          predicted_ctr?: number | null
          predicted_revenue?: number | null
          product_id?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          predicted_conversion?: number | null
          predicted_ctr?: number | null
          predicted_revenue?: number | null
          product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_performance_predictions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_performance_predictions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_performance_predictions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_product_data: {
        Row: {
          channel_id: string
          created_at: string | null
          external_id: string | null
          id: string
          last_published_at: string | null
          payload: Json | null
          product_id: string
          status: string | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_published_at?: string | null
          payload?: Json | null
          product_id: string
          status?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          last_published_at?: string | null
          payload?: Json | null
          product_id?: string
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_product_data_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_product_data_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_product_data_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_publish_job_items: {
        Row: {
          channel_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          job_id: string
          payload: Json | null
          product_id: string
          response: Json | null
          status: string | null
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          job_id: string
          payload?: Json | null
          product_id: string
          response?: Json | null
          status?: string | null
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          job_id?: string
          payload?: Json | null
          product_id?: string
          response?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_publish_job_items_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_publish_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "channel_publish_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_publish_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_publish_jobs: {
        Row: {
          channel_id: string
          completed_at: string | null
          created_at: string | null
          failed_products: number | null
          id: string
          job_status:
            | Database["public"]["Enums"]["channel_job_status_enum"]
            | null
          processed_products: number | null
          total_products: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          created_at?: string | null
          failed_products?: number | null
          id?: string
          job_status?:
            | Database["public"]["Enums"]["channel_job_status_enum"]
            | null
          processed_products?: number | null
          total_products?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          created_at?: string | null
          failed_products?: number | null
          id?: string
          job_status?:
            | Database["public"]["Enums"]["channel_job_status_enum"]
            | null
          processed_products?: number | null
          total_products?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_publish_jobs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_publish_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_rejections: {
        Row: {
          channel_id: string
          created_at: string | null
          external_code: string | null
          external_message: string | null
          field_impacted: string | null
          id: string
          product_id: string
          rejection_type: string | null
          resolution_note: string | null
          resolved: boolean | null
          resolved_at: string | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          external_code?: string | null
          external_message?: string | null
          field_impacted?: string | null
          id?: string
          product_id: string
          rejection_type?: string | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          external_code?: string | null
          external_message?: string | null
          field_impacted?: string | null
          id?: string
          product_id?: string
          rejection_type?: string | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_rejections_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_rejections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_rejections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_rule_learning: {
        Row: {
          accepted_by_user: boolean | null
          channel_id: string
          created_at: string | null
          frequency: number | null
          id: string
          pattern_detected: string
          source_type:
            | Database["public"]["Enums"]["learning_source_enum"]
            | null
          suggested_rule: Json | null
          workspace_id: string
        }
        Insert: {
          accepted_by_user?: boolean | null
          channel_id: string
          created_at?: string | null
          frequency?: number | null
          id?: string
          pattern_detected: string
          source_type?:
            | Database["public"]["Enums"]["learning_source_enum"]
            | null
          suggested_rule?: Json | null
          workspace_id: string
        }
        Update: {
          accepted_by_user?: boolean | null
          channel_id?: string
          created_at?: string | null
          frequency?: number | null
          id?: string
          pattern_detected?: string
          source_type?:
            | Database["public"]["Enums"]["learning_source_enum"]
            | null
          suggested_rule?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_rule_learning_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_rule_learning_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_rules: {
        Row: {
          actions: Json
          channel_id: string
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: Database["public"]["Enums"]["channel_rule_type_enum"]
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actions?: Json
          channel_id: string
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: Database["public"]["Enums"]["channel_rule_type_enum"]
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actions?: Json
          channel_id?: string
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: Database["public"]["Enums"]["channel_rule_type_enum"]
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_rules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_name: string
          channel_type: Database["public"]["Enums"]["channel_type_enum"]
          config: Json | null
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          channel_name: string
          channel_type: Database["public"]["Enums"]["channel_type_enum"]
          config?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          channel_name?: string
          channel_type?: Database["public"]["Enums"]["channel_type_enum"]
          config?: Json | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_explanations: {
        Row: {
          confidence: number | null
          created_at: string | null
          decision_id: string
          explanation: Json | null
          id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          decision_id: string
          explanation?: Json | null
          id?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          decision_id?: string
          explanation?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_explanations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "catalog_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_performance_history: {
        Row: {
          actual_impact: number | null
          confidence: number | null
          created_at: string | null
          decision_id: string | null
          expected_impact: number | null
          id: string
          learning_outcome:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          metadata: Json | null
          plan_id: string | null
          workspace_id: string
        }
        Insert: {
          actual_impact?: number | null
          confidence?: number | null
          created_at?: string | null
          decision_id?: string | null
          expected_impact?: number | null
          id?: string
          learning_outcome?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          metadata?: Json | null
          plan_id?: string | null
          workspace_id: string
        }
        Update: {
          actual_impact?: number | null
          confidence?: number | null
          created_at?: string | null
          decision_id?: string | null
          expected_impact?: number | null
          id?: string
          learning_outcome?:
            | Database["public"]["Enums"]["learning_outcome_type"]
            | null
          metadata?: Json | null
          plan_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_performance_history_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "catalog_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_performance_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catalog_brain_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_performance_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_signals: {
        Row: {
          category_id: string | null
          detected_at: string | null
          id: string
          keyword: string | null
          payload: Json | null
          product_id: string | null
          signal_strength: number | null
          signal_type: Database["public"]["Enums"]["demand_signal_type"] | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          keyword?: string | null
          payload?: Json | null
          product_id?: string | null
          signal_strength?: number | null
          signal_type?: Database["public"]["Enums"]["demand_signal_type"] | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          keyword?: string | null
          payload?: Json | null
          product_id?: string | null
          signal_strength?: number | null
          signal_type?: Database["public"]["Enums"]["demand_signal_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_signals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_sources: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          source_name: string | null
          source_type: Database["public"]["Enums"]["demand_source_type"] | null
          workspace_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["demand_source_type"] | null
          workspace_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["demand_source_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_trends: {
        Row: {
          detected_at: string | null
          id: string
          keyword: string | null
          trend_direction: string | null
          trend_strength: number | null
          workspace_id: string
        }
        Insert: {
          detected_at?: string | null
          id?: string
          keyword?: string | null
          trend_direction?: string | null
          trend_strength?: number | null
          workspace_id: string
        }
        Update: {
          detected_at?: string | null
          id?: string
          keyword?: string | null
          trend_direction?: string | null
          trend_strength?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_trends_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          id: string
          severity: string
          source: string
          stack_trace: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          id?: string
          severity?: string
          source?: string
          stack_trace?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          id?: string
          severity?: string
          source?: string
          stack_trace?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_case_signatures: {
        Row: {
          confidence: number
          created_at: string
          id: string
          layout_signature: Json | null
          resolved_output: Json | null
          sample_payload: Json | null
          signature_embedding: Json | null
          signature_hash: string
          supplier_name: string | null
          table_signature: Json | null
          workspace_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          layout_signature?: Json | null
          resolved_output?: Json | null
          sample_payload?: Json | null
          signature_embedding?: Json | null
          signature_hash: string
          supplier_name?: string | null
          table_signature?: Json | null
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          layout_signature?: Json | null
          resolved_output?: Json | null
          sample_payload?: Json | null
          signature_embedding?: Json | null
          signature_hash?: string
          supplier_name?: string | null
          table_signature?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_case_signatures_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_corrections: {
        Row: {
          applied_pattern_id: string | null
          corrected_value: string | null
          correction_type: Database["public"]["Enums"]["correction_type"]
          created_at: string
          field_key: string
          id: string
          pdf_row_id: string | null
          pdf_table_id: string | null
          product_id: string | null
          raw_value: string | null
          review_context: Json | null
          reviewed_by: string
          workspace_id: string
        }
        Insert: {
          applied_pattern_id?: string | null
          corrected_value?: string | null
          correction_type: Database["public"]["Enums"]["correction_type"]
          created_at?: string
          field_key: string
          id?: string
          pdf_row_id?: string | null
          pdf_table_id?: string | null
          product_id?: string | null
          raw_value?: string | null
          review_context?: Json | null
          reviewed_by: string
          workspace_id: string
        }
        Update: {
          applied_pattern_id?: string | null
          corrected_value?: string | null
          correction_type?: Database["public"]["Enums"]["correction_type"]
          created_at?: string
          field_key?: string
          id?: string
          pdf_row_id?: string | null
          pdf_table_id?: string | null
          product_id?: string | null
          raw_value?: string | null
          review_context?: Json | null
          reviewed_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_corrections_applied_pattern_id_fkey"
            columns: ["applied_pattern_id"]
            isOneToOne: false
            referencedRelation: "extraction_memory_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_corrections_pdf_row_id_fkey"
            columns: ["pdf_row_id"]
            isOneToOne: false
            referencedRelation: "pdf_table_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_corrections_pdf_table_id_fkey"
            columns: ["pdf_table_id"]
            isOneToOne: false
            referencedRelation: "pdf_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_corrections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_corrections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_decision_history: {
        Row: {
          approved: boolean
          approved_by: string | null
          confidence: number
          created_at: string
          decision_output: Json
          decision_type: Database["public"]["Enums"]["extraction_decision_type"]
          id: string
          input_signature: Json
          workspace_id: string
        }
        Insert: {
          approved?: boolean
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision_output?: Json
          decision_type: Database["public"]["Enums"]["extraction_decision_type"]
          id?: string
          input_signature?: Json
          workspace_id: string
        }
        Update: {
          approved?: boolean
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision_output?: Json
          decision_type?: Database["public"]["Enums"]["extraction_decision_type"]
          id?: string
          input_signature?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_decision_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_memory_patterns: {
        Row: {
          confidence: number
          created_at: string
          created_by: string | null
          failure_count: number
          id: string
          last_confirmed_at: string | null
          last_used_at: string | null
          pattern_key: string
          pattern_type: Database["public"]["Enums"]["extraction_pattern_type"]
          pattern_value: Json
          source_type: Database["public"]["Enums"]["extraction_pattern_source"]
          success_count: number
          supplier_name: string | null
          updated_at: string
          usage_count: number
          workspace_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          created_by?: string | null
          failure_count?: number
          id?: string
          last_confirmed_at?: string | null
          last_used_at?: string | null
          pattern_key: string
          pattern_type: Database["public"]["Enums"]["extraction_pattern_type"]
          pattern_value?: Json
          source_type: Database["public"]["Enums"]["extraction_pattern_source"]
          success_count?: number
          supplier_name?: string | null
          updated_at?: string
          usage_count?: number
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          created_by?: string | null
          failure_count?: number
          id?: string
          last_confirmed_at?: string | null
          last_used_at?: string | null
          pattern_key?: string
          pattern_type?: Database["public"]["Enums"]["extraction_pattern_type"]
          pattern_value?: Json
          source_type?: Database["public"]["Enums"]["extraction_pattern_source"]
          success_count?: number
          supplier_name?: string | null
          updated_at?: string
          usage_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_memory_patterns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      image_credits: {
        Row: {
          id: string
          monthly_limit: number
          reset_at: string
          updated_at: string
          used_this_month: number
          workspace_id: string
        }
        Insert: {
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          used_this_month?: number
          workspace_id: string
        }
        Update: {
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          used_this_month?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      image_job_items: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          error_payload: Json | null
          id: string
          image_id: string | null
          input_url: string | null
          job_id: string
          max_retries: number
          operation: Database["public"]["Enums"]["image_operation_enum"]
          output_url: string | null
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["image_job_item_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          id?: string
          image_id?: string | null
          input_url?: string | null
          job_id: string
          max_retries?: number
          operation: Database["public"]["Enums"]["image_operation_enum"]
          output_url?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["image_job_item_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          id?: string
          image_id?: string | null
          input_url?: string | null
          job_id?: string
          max_retries?: number
          operation?: Database["public"]["Enums"]["image_operation_enum"]
          output_url?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["image_job_item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "image_job_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "asset_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "image_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      image_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          failed_items: number
          id: string
          processed_items: number
          started_at: string | null
          status: Database["public"]["Enums"]["image_job_status"]
          total_items: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failed_items?: number
          id?: string
          processed_items?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["image_job_status"]
          total_items?: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failed_items?: number
          id?: string
          processed_items?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["image_job_status"]
          total_items?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          alt_text: string | null
          asset_id: string | null
          created_at: string
          id: string
          optimized_url: string | null
          original_url: string | null
          product_id: string
          s3_key: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["image_status"]
          usage_context: Database["public"]["Enums"]["asset_usage_enum"] | null
        }
        Insert: {
          alt_text?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          optimized_url?: string | null
          original_url?: string | null
          product_id: string
          s3_key?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          usage_context?: Database["public"]["Enums"]["asset_usage_enum"] | null
        }
        Update: {
          alt_text?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          optimized_url?: string | null
          original_url?: string | null
          product_id?: string
          s3_key?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          usage_context?: Database["public"]["Enums"]["asset_usage_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "images_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_models: {
        Row: {
          created_at: string | null
          dimension: Database["public"]["Enums"]["impact_dimension"]
          id: string
          model_name: string
          weight: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          dimension: Database["public"]["Enums"]["impact_dimension"]
          id?: string
          model_name: string
          weight?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          dimension?: Database["public"]["Enums"]["impact_dimension"]
          id?: string
          model_name?: string
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_models_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_job_items: {
        Row: {
          action: Database["public"]["Enums"]["ingestion_action_type"] | null
          created_at: string
          error_message: string | null
          error_payload: Json | null
          grouping_confidence: number | null
          id: string
          is_parent: boolean | null
          job_id: string
          mapped_data: Json | null
          match_confidence: number | null
          matched_existing_id: string | null
          parent_group_key: string | null
          product_id: string | null
          source_data: Json | null
          source_row_index: number | null
          status: Database["public"]["Enums"]["ingestion_item_status"]
        }
        Insert: {
          action?: Database["public"]["Enums"]["ingestion_action_type"] | null
          created_at?: string
          error_message?: string | null
          error_payload?: Json | null
          grouping_confidence?: number | null
          id?: string
          is_parent?: boolean | null
          job_id: string
          mapped_data?: Json | null
          match_confidence?: number | null
          matched_existing_id?: string | null
          parent_group_key?: string | null
          product_id?: string | null
          source_data?: Json | null
          source_row_index?: number | null
          status?: Database["public"]["Enums"]["ingestion_item_status"]
        }
        Update: {
          action?: Database["public"]["Enums"]["ingestion_action_type"] | null
          created_at?: string
          error_message?: string | null
          error_payload?: Json | null
          grouping_confidence?: number | null
          id?: string
          is_parent?: boolean | null
          job_id?: string
          mapped_data?: Json | null
          match_confidence?: number | null
          matched_existing_id?: string | null
          parent_group_key?: string | null
          product_id?: string | null
          source_data?: Json | null
          source_row_index?: number | null
          status?: Database["public"]["Enums"]["ingestion_item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ingestion_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_job_items_matched_existing_id_fkey"
            columns: ["matched_existing_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicate_rows: number
          error_message: string | null
          failed_rows: number
          file_name: string | null
          id: string
          imported_rows: number
          merge_strategy: Database["public"]["Enums"]["ingestion_merge_strategy"]
          mode: Database["public"]["Enums"]["ingestion_mode"]
          parsed_rows: number
          results: Json
          skipped_rows: number
          source_id: string | null
          source_type:
            | Database["public"]["Enums"]["ingestion_source_type"]
            | null
          started_at: string | null
          status: Database["public"]["Enums"]["ingestion_job_status"]
          total_rows: number
          updated_at: string
          updated_rows: number
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          error_message?: string | null
          failed_rows?: number
          file_name?: string | null
          id?: string
          imported_rows?: number
          merge_strategy?: Database["public"]["Enums"]["ingestion_merge_strategy"]
          mode?: Database["public"]["Enums"]["ingestion_mode"]
          parsed_rows?: number
          results?: Json
          skipped_rows?: number
          source_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["ingestion_source_type"]
            | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          total_rows?: number
          updated_at?: string
          updated_rows?: number
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          error_message?: string | null
          failed_rows?: number
          file_name?: string | null
          id?: string
          imported_rows?: number
          merge_strategy?: Database["public"]["Enums"]["ingestion_merge_strategy"]
          mode?: Database["public"]["Enums"]["ingestion_mode"]
          parsed_rows?: number
          results?: Json
          skipped_rows?: number
          source_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["ingestion_source_type"]
            | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ingestion_job_status"]
          total_rows?: number
          updated_at?: string
          updated_rows?: number
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_sources: {
        Row: {
          config: Json
          created_at: string
          duplicate_detection_fields: string[]
          field_mappings: Json
          grouping_config: Json
          id: string
          is_active: boolean
          last_run_at: string | null
          merge_strategy: Database["public"]["Enums"]["ingestion_merge_strategy"]
          name: string
          schedule_cron: string | null
          source_type: Database["public"]["Enums"]["ingestion_source_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          duplicate_detection_fields?: string[]
          field_mappings?: Json
          grouping_config?: Json
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          merge_strategy?: Database["public"]["Enums"]["ingestion_merge_strategy"]
          name: string
          schedule_cron?: string | null
          source_type: Database["public"]["Enums"]["ingestion_source_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          duplicate_detection_fields?: string[]
          field_mappings?: Json
          grouping_config?: Json
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          merge_strategy?: Database["public"]["Enums"]["ingestion_merge_strategy"]
          name?: string
          schedule_cron?: string | null
          source_type?: Database["public"]["Enums"]["ingestion_source_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_opportunities: {
        Row: {
          category_id: string | null
          competition_level: number | null
          created_at: string | null
          estimated_search_volume: number | null
          id: string
          keyword: string | null
          opportunity_score: number | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          competition_level?: number | null
          created_at?: string | null
          estimated_search_volume?: number | null
          id?: string
          keyword?: string | null
          opportunity_score?: number | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          competition_level?: number | null
          created_at?: string | null
          estimated_search_volume?: number | null
          id?: string
          keyword?: string | null
          opportunity_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          file_id: string
          id: string
          source_name: string | null
          tsv: unknown
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          file_id: string
          id?: string
          source_name?: string | null
          tsv?: unknown
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          file_id?: string
          id?: string
          source_name?: string | null
          tsv?: unknown
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      locale_style_guides: {
        Row: {
          channel_id: string | null
          created_at: string | null
          cta_patterns: string[] | null
          forbidden_terms: string[] | null
          id: string
          locale: string
          preferred_patterns: string[] | null
          seo_rules: Json | null
          tone: string | null
          units_style: Json | null
          updated_at: string | null
          workspace_id: string
          writing_rules: Json | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          cta_patterns?: string[] | null
          forbidden_terms?: string[] | null
          id?: string
          locale: string
          preferred_patterns?: string[] | null
          seo_rules?: Json | null
          tone?: string | null
          units_style?: Json | null
          updated_at?: string | null
          workspace_id: string
          writing_rules?: Json | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          cta_patterns?: string[] | null
          forbidden_terms?: string[] | null
          id?: string
          locale?: string
          preferred_patterns?: string[] | null
          seo_rules?: Json | null
          tone?: string | null
          units_style?: Json | null
          updated_at?: string | null
          workspace_id?: string
          writing_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "locale_style_guides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_benchmarks: {
        Row: {
          average_description_length: number | null
          average_image_count: number | null
          average_title_length: number | null
          benchmark_date: string | null
          category_id: string | null
          channel_type: string | null
          common_attributes: Json | null
          common_keywords: Json | null
          id: string
          median_price: number | null
          workspace_id: string
        }
        Insert: {
          average_description_length?: number | null
          average_image_count?: number | null
          average_title_length?: number | null
          benchmark_date?: string | null
          category_id?: string | null
          channel_type?: string | null
          common_attributes?: Json | null
          common_keywords?: Json | null
          id?: string
          median_price?: number | null
          workspace_id: string
        }
        Update: {
          average_description_length?: number | null
          average_image_count?: number | null
          average_title_length?: number | null
          benchmark_date?: string | null
          category_id?: string | null
          channel_type?: string | null
          common_attributes?: Json | null
          common_keywords?: Json | null
          id?: string
          median_price?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_benchmarks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_observations: {
        Row: {
          id: string
          observed_at: string | null
          observed_attributes: Json | null
          observed_availability: string | null
          observed_brand: string | null
          observed_category: string | null
          observed_images: Json | null
          observed_price: number | null
          observed_rating: number | null
          observed_reviews_count: number | null
          observed_sale_price: number | null
          observed_title: string | null
          observed_url: string | null
          source_id: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          observed_at?: string | null
          observed_attributes?: Json | null
          observed_availability?: string | null
          observed_brand?: string | null
          observed_category?: string | null
          observed_images?: Json | null
          observed_price?: number | null
          observed_rating?: number | null
          observed_reviews_count?: number | null
          observed_sale_price?: number | null
          observed_title?: string | null
          observed_url?: string | null
          source_id?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          observed_at?: string | null
          observed_attributes?: Json | null
          observed_availability?: string | null
          observed_brand?: string | null
          observed_category?: string | null
          observed_images?: Json | null
          observed_price?: number | null
          observed_rating?: number | null
          observed_reviews_count?: number | null
          observed_sale_price?: number | null
          observed_title?: string | null
          observed_url?: string | null
          source_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_observations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "market_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_opportunities: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          created_at: string | null
          estimated_revenue_impact: number | null
          id: string
          opportunity_type:
            | Database["public"]["Enums"]["market_opportunity_type"]
            | null
          priority_score: number | null
          product_id: string | null
          recommendation_payload: Json | null
          status: string | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_revenue_impact?: number | null
          id?: string
          opportunity_type?:
            | Database["public"]["Enums"]["market_opportunity_type"]
            | null
          priority_score?: number | null
          product_id?: string | null
          recommendation_payload?: Json | null
          status?: string | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_revenue_impact?: number | null
          id?: string
          opportunity_type?:
            | Database["public"]["Enums"]["market_opportunity_type"]
            | null
          priority_score?: number | null
          product_id?: string | null
          recommendation_payload?: Json | null
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_product_matches: {
        Row: {
          created_at: string | null
          id: string
          market_observation_id: string | null
          match_confidence: number | null
          match_reason: string | null
          product_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_observation_id?: string | null
          match_confidence?: number | null
          match_reason?: string | null
          product_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          market_observation_id?: string | null
          match_confidence?: number | null
          match_reason?: string | null
          product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_product_matches_market_observation_id_fkey"
            columns: ["market_observation_id"]
            isOneToOne: false
            referencedRelation: "market_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_product_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_product_matches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_signals: {
        Row: {
          category_id: string | null
          detected_at: string | null
          id: string
          product_id: string | null
          signal_payload: Json | null
          signal_strength: number | null
          signal_type: Database["public"]["Enums"]["market_signal_type"] | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          product_id?: string | null
          signal_payload?: Json | null
          signal_strength?: number | null
          signal_type?: Database["public"]["Enums"]["market_signal_type"] | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          product_id?: string | null
          signal_payload?: Json | null
          signal_strength?: number | null
          signal_type?: Database["public"]["Enums"]["market_signal_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_signals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_signals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sources: {
        Row: {
          base_url: string | null
          config: Json | null
          crawl_frequency: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          source_name: string | null
          source_type: Database["public"]["Enums"]["market_source_type"] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          base_url?: string | null
          config?: Json | null
          crawl_frequency?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["market_source_type"] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          base_url?: string | null
          config?: Json | null
          crawl_frequency?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["market_source_type"] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_trends: {
        Row: {
          category_id: string | null
          detected_at: string | null
          id: string
          trend_signal: Json | null
          trend_strength: number | null
          trend_type: string | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          trend_signal?: Json | null
          trend_strength?: number | null
          trend_type?: string | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          detected_at?: string | null
          id?: string
          trend_signal?: Json | null
          trend_strength?: number | null
          trend_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_trends_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_opportunities: {
        Row: {
          confidence: number | null
          created_at: string | null
          description: string | null
          estimated_revenue_gain: number | null
          id: string
          opportunity_type: Database["public"]["Enums"]["opportunity_type_enum"]
          product_id: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          estimated_revenue_gain?: number | null
          id?: string
          opportunity_type: Database["public"]["Enums"]["opportunity_type_enum"]
          product_id?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          estimated_revenue_gain?: number | null
          id?: string
          opportunity_type?: Database["public"]["Enums"]["opportunity_type_enum"]
          product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monetization_opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monetization_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      normalization_dictionary: {
        Row: {
          confidence: number
          created_at: string
          dictionary_type: Database["public"]["Enums"]["normalization_type"]
          id: string
          language: string | null
          normalized_term: string
          source_term: string
          supplier_name: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          dictionary_type: Database["public"]["Enums"]["normalization_type"]
          id?: string
          language?: string | null
          normalized_term: string
          source_term: string
          supplier_name?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          dictionary_type?: Database["public"]["Enums"]["normalization_type"]
          id?: string
          language?: string | null
          normalized_term?: string
          source_term?: string
          supplier_name?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "normalization_dictionary_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_job_items: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          error_payload: Json | null
          fields_optimized: string[] | null
          id: string
          job_id: string
          max_retries: number | null
          model_used: string | null
          product_id: string
          rag_chunks_used: number | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_item_status"]
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          fields_optimized?: string[] | null
          id?: string
          job_id: string
          max_retries?: number | null
          model_used?: string | null
          product_id: string
          rag_chunks_used?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_item_status"]
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          fields_optimized?: string[] | null
          id?: string
          job_id?: string
          max_retries?: number | null
          model_used?: string | null
          product_id?: string
          rag_chunks_used?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_item_status"]
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "optimization_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_phase: number | null
          current_product_name: string | null
          error_message: string | null
          failed_products: number
          fields_to_optimize: string[] | null
          id: string
          model_override: string | null
          processed_products: number
          product_ids: string[]
          results: Json | null
          selected_phases: number[] | null
          started_at: string | null
          status: string
          total_products: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_phase?: number | null
          current_product_name?: string | null
          error_message?: string | null
          failed_products?: number
          fields_to_optimize?: string[] | null
          id?: string
          model_override?: string | null
          processed_products?: number
          product_ids?: string[]
          results?: Json | null
          selected_phases?: number[] | null
          started_at?: string | null
          status?: string
          total_products?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_phase?: number | null
          current_product_name?: string | null
          error_message?: string | null
          failed_products?: number
          fields_to_optimize?: string[] | null
          id?: string
          model_override?: string | null
          processed_products?: number
          product_ids?: string[]
          results?: Json | null
          selected_phases?: number[] | null
          started_at?: string | null
          status?: string
          total_products?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimization_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_logs: {
        Row: {
          chunks_used: number | null
          completion_tokens: number | null
          created_at: string
          fields_optimized: string[] | null
          had_catalog: boolean | null
          had_knowledge: boolean | null
          had_supplier: boolean | null
          id: string
          knowledge_sources: Json | null
          model: string
          product_id: string
          prompt_length: number | null
          prompt_tokens: number | null
          rag_match_types: Json | null
          supplier_name: string | null
          supplier_url: string | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          chunks_used?: number | null
          completion_tokens?: number | null
          created_at?: string
          fields_optimized?: string[] | null
          had_catalog?: boolean | null
          had_knowledge?: boolean | null
          had_supplier?: boolean | null
          id?: string
          knowledge_sources?: Json | null
          model?: string
          product_id: string
          prompt_length?: number | null
          prompt_tokens?: number | null
          rag_match_types?: Json | null
          supplier_name?: string | null
          supplier_url?: string | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          chunks_used?: number | null
          completion_tokens?: number | null
          created_at?: string
          fields_optimized?: string[] | null
          had_catalog?: boolean | null
          had_knowledge?: boolean | null
          had_supplier?: boolean | null
          id?: string
          knowledge_sources?: Json | null
          model?: string
          product_id?: string
          prompt_length?: number | null
          prompt_tokens?: number | null
          rag_match_types?: Json | null
          supplier_name?: string | null
          supplier_url?: string | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_detected_images: {
        Row: {
          bbox: Json | null
          confidence: number | null
          created_at: string
          id: string
          image_type: Database["public"]["Enums"]["pdf_image_type"]
          image_url: string | null
          nearest_row_id: string | null
          nearest_table_id: string | null
          page_id: string
        }
        Insert: {
          bbox?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          image_type?: Database["public"]["Enums"]["pdf_image_type"]
          image_url?: string | null
          nearest_row_id?: string | null
          nearest_table_id?: string | null
          page_id: string
        }
        Update: {
          bbox?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          image_type?: Database["public"]["Enums"]["pdf_image_type"]
          image_url?: string | null
          nearest_row_id?: string | null
          nearest_table_id?: string | null
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_detected_images_nearest_row_id_fkey"
            columns: ["nearest_row_id"]
            isOneToOne: false
            referencedRelation: "pdf_table_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_detected_images_nearest_table_id_fkey"
            columns: ["nearest_table_id"]
            isOneToOne: false
            referencedRelation: "pdf_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_detected_images_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_extraction_metrics: {
        Row: {
          avg_confidence: number | null
          created_at: string
          extraction_id: string
          id: string
          mapping_success_rate: number | null
          processing_time: number | null
          rows_extracted: number | null
          tables_detected: number | null
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string
          extraction_id: string
          id?: string
          mapping_success_rate?: number | null
          processing_time?: number | null
          rows_extracted?: number | null
          tables_detected?: number | null
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string
          extraction_id?: string
          id?: string
          mapping_success_rate?: number | null
          processing_time?: number | null
          rows_extracted?: number | null
          tables_detected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_extraction_metrics_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "pdf_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_extractions: {
        Row: {
          completed_at: string | null
          created_at: string
          extraction_method:
            | Database["public"]["Enums"]["pdf_extraction_method"]
            | null
          file_id: string
          id: string
          model_used: string | null
          processed_pages: number | null
          status: Database["public"]["Enums"]["pdf_extraction_status"]
          total_pages: number | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          extraction_method?:
            | Database["public"]["Enums"]["pdf_extraction_method"]
            | null
          file_id: string
          id?: string
          model_used?: string | null
          processed_pages?: number | null
          status?: Database["public"]["Enums"]["pdf_extraction_status"]
          total_pages?: number | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          extraction_method?:
            | Database["public"]["Enums"]["pdf_extraction_method"]
            | null
          file_id?: string
          id?: string
          model_used?: string | null
          processed_pages?: number | null
          status?: Database["public"]["Enums"]["pdf_extraction_status"]
          total_pages?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_extractions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_extractions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_language_segments: {
        Row: {
          bbox: Json | null
          confidence: number | null
          id: string
          language: string
          page_id: string
        }
        Insert: {
          bbox?: Json | null
          confidence?: number | null
          id?: string
          language: string
          page_id: string
        }
        Update: {
          bbox?: Json | null
          confidence?: number | null
          id?: string
          language?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_language_segments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_layout_signatures: {
        Row: {
          column_count: number | null
          created_at: string
          id: string
          image_positions: Json | null
          layout_structure: Json | null
          page_hash: string
          supplier_guess: string | null
          table_positions: Json | null
        }
        Insert: {
          column_count?: number | null
          created_at?: string
          id?: string
          image_positions?: Json | null
          layout_structure?: Json | null
          page_hash: string
          supplier_guess?: string | null
          table_positions?: Json | null
        }
        Update: {
          column_count?: number | null
          created_at?: string
          id?: string
          image_positions?: Json | null
          layout_structure?: Json | null
          page_hash?: string
          supplier_guess?: string | null
          table_positions?: Json | null
        }
        Relationships: []
      }
      pdf_page_blocks: {
        Row: {
          bbox: Json | null
          block_type: Database["public"]["Enums"]["pdf_block_type"]
          confidence: number | null
          created_at: string
          id: string
          page_id: string
          parent_block_id: string | null
          reading_order: number
          semantic_role: Database["public"]["Enums"]["pdf_block_role"] | null
          text_content: string | null
        }
        Insert: {
          bbox?: Json | null
          block_type: Database["public"]["Enums"]["pdf_block_type"]
          confidence?: number | null
          created_at?: string
          id?: string
          page_id: string
          parent_block_id?: string | null
          reading_order?: number
          semantic_role?: Database["public"]["Enums"]["pdf_block_role"] | null
          text_content?: string | null
        }
        Update: {
          bbox?: Json | null
          block_type?: Database["public"]["Enums"]["pdf_block_type"]
          confidence?: number | null
          created_at?: string
          id?: string
          page_id?: string
          parent_block_id?: string | null
          reading_order?: number
          semantic_role?: Database["public"]["Enums"]["pdf_block_role"] | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_page_blocks_parent_block_id_fkey"
            columns: ["parent_block_id"]
            isOneToOne: false
            referencedRelation: "pdf_page_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_pages: {
        Row: {
          confidence_score: number | null
          extraction_id: string
          has_images: boolean | null
          has_tables: boolean | null
          id: string
          layout_zones: Json | null
          page_context: Json | null
          page_image_url: string | null
          page_number: number
          raw_text: string | null
          reconciled_result: Json | null
          status: Database["public"]["Enums"]["pdf_page_status"]
          text_result: Json | null
          vision_result: Json | null
          zones: Json | null
        }
        Insert: {
          confidence_score?: number | null
          extraction_id: string
          has_images?: boolean | null
          has_tables?: boolean | null
          id?: string
          layout_zones?: Json | null
          page_context?: Json | null
          page_image_url?: string | null
          page_number: number
          raw_text?: string | null
          reconciled_result?: Json | null
          status?: Database["public"]["Enums"]["pdf_page_status"]
          text_result?: Json | null
          vision_result?: Json | null
          zones?: Json | null
        }
        Update: {
          confidence_score?: number | null
          extraction_id?: string
          has_images?: boolean | null
          has_tables?: boolean | null
          id?: string
          layout_zones?: Json | null
          page_context?: Json | null
          page_image_url?: string | null
          page_number?: number
          raw_text?: string | null
          reconciled_result?: Json | null
          status?: Database["public"]["Enums"]["pdf_page_status"]
          text_result?: Json | null
          vision_result?: Json | null
          zones?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_pages_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "pdf_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_sections: {
        Row: {
          bbox: Json | null
          confidence: number | null
          id: string
          page_id: string
          section_title: string
        }
        Insert: {
          bbox?: Json | null
          confidence?: number | null
          id?: string
          page_id: string
          section_title: string
        }
        Update: {
          bbox?: Json | null
          confidence?: number | null
          id?: string
          page_id?: string
          section_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_table_rows: {
        Row: {
          cells: Json
          id: string
          mapped_product_id: string | null
          mapping_confidence: number | null
          reconciled_cells: Json | null
          row_context: Json | null
          row_index: number
          status: Database["public"]["Enums"]["pdf_row_status"]
          table_id: string
          text_cells: Json | null
          validation_errors: Json | null
          vision_cells: Json | null
        }
        Insert: {
          cells?: Json
          id?: string
          mapped_product_id?: string | null
          mapping_confidence?: number | null
          reconciled_cells?: Json | null
          row_context?: Json | null
          row_index?: number
          status?: Database["public"]["Enums"]["pdf_row_status"]
          table_id: string
          text_cells?: Json | null
          validation_errors?: Json | null
          vision_cells?: Json | null
        }
        Update: {
          cells?: Json
          id?: string
          mapped_product_id?: string | null
          mapping_confidence?: number | null
          reconciled_cells?: Json | null
          row_context?: Json | null
          row_index?: number
          status?: Database["public"]["Enums"]["pdf_row_status"]
          table_id?: string
          text_cells?: Json | null
          validation_errors?: Json | null
          vision_cells?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_table_rows_mapped_product_id_fkey"
            columns: ["mapped_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_table_rows_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "pdf_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_table_templates: {
        Row: {
          column_aliases: Json
          confidence_boost_rules: Json
          created_at: string
          expected_columns: Json
          header_patterns: Json
          id: string
          parsing_rules: Json
          supplier_name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          column_aliases?: Json
          confidence_boost_rules?: Json
          created_at?: string
          expected_columns?: Json
          header_patterns?: Json
          id?: string
          parsing_rules?: Json
          supplier_name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          column_aliases?: Json
          confidence_boost_rules?: Json
          created_at?: string
          expected_columns?: Json
          header_patterns?: Json
          id?: string
          parsing_rules?: Json
          supplier_name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_table_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_tables: {
        Row: {
          bounding_box: Json | null
          col_count: number | null
          column_classifications: Json | null
          confidence_score: number | null
          headers: string[] | null
          id: string
          mapped_to_products: boolean | null
          page_id: string
          reconciled_data: Json | null
          reconciliation_reasons: Json | null
          row_count: number | null
          rows: Json | null
          table_index: number
          table_type: Database["public"]["Enums"]["pdf_table_type"] | null
          template_id: string | null
          text_source_data: Json | null
          vision_source_data: Json | null
        }
        Insert: {
          bounding_box?: Json | null
          col_count?: number | null
          column_classifications?: Json | null
          confidence_score?: number | null
          headers?: string[] | null
          id?: string
          mapped_to_products?: boolean | null
          page_id: string
          reconciled_data?: Json | null
          reconciliation_reasons?: Json | null
          row_count?: number | null
          rows?: Json | null
          table_index?: number
          table_type?: Database["public"]["Enums"]["pdf_table_type"] | null
          template_id?: string | null
          text_source_data?: Json | null
          vision_source_data?: Json | null
        }
        Update: {
          bounding_box?: Json | null
          col_count?: number | null
          column_classifications?: Json | null
          confidence_score?: number | null
          headers?: string[] | null
          id?: string
          mapped_to_products?: boolean | null
          page_id?: string
          reconciled_data?: Json | null
          reconciliation_reasons?: Json | null
          row_count?: number | null
          rows?: Json | null
          table_index?: number
          table_type?: Database["public"]["Enums"]["pdf_table_type"] | null
          template_id?: string | null
          text_source_data?: Json | null
          vision_source_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_tables_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pdf_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_tables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_table_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_recommendations: {
        Row: {
          confidence: number | null
          created_at: string | null
          current_price: number | null
          expected_margin: number | null
          id: string
          minimum_price: number | null
          product_id: string | null
          recommended_price: number | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          current_price?: number | null
          expected_margin?: number | null
          id?: string
          minimum_price?: number | null
          product_id?: string | null
          recommended_price?: number | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          current_price?: number | null
          expected_margin?: number | null
          id?: string
          minimum_price?: number | null
          product_id?: string | null
          recommended_price?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_dna_profiles: {
        Row: {
          category_cluster: string | null
          channel_dna: Json | null
          channel_identity: Json | null
          commercial_dna: Json | null
          commercial_identity: Json | null
          completeness_score: number | null
          created_at: string
          family_id: string | null
          id: string
          linguistic_dna: Json | null
          linguistic_identity: Json | null
          product_id: string
          quality_score: number | null
          technical_dna: Json | null
          technical_identity: Json | null
          updated_at: string
          visual_dna: Json | null
          visual_identity: Json | null
          workspace_id: string
        }
        Insert: {
          category_cluster?: string | null
          channel_dna?: Json | null
          channel_identity?: Json | null
          commercial_dna?: Json | null
          commercial_identity?: Json | null
          completeness_score?: number | null
          created_at?: string
          family_id?: string | null
          id?: string
          linguistic_dna?: Json | null
          linguistic_identity?: Json | null
          product_id: string
          quality_score?: number | null
          technical_dna?: Json | null
          technical_identity?: Json | null
          updated_at?: string
          visual_dna?: Json | null
          visual_identity?: Json | null
          workspace_id: string
        }
        Update: {
          category_cluster?: string | null
          channel_dna?: Json | null
          channel_identity?: Json | null
          commercial_dna?: Json | null
          commercial_identity?: Json | null
          completeness_score?: number | null
          created_at?: string
          family_id?: string | null
          id?: string
          linguistic_dna?: Json | null
          linguistic_identity?: Json | null
          product_id?: string
          quality_score?: number | null
          technical_dna?: Json | null
          technical_identity?: Json | null
          updated_at?: string
          visual_dna?: Json | null
          visual_identity?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_dna_profiles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_dna_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_field_confidence: {
        Row: {
          confidence_score: number
          created_at: string
          extraction_method: string | null
          field_key: string
          id: string
          product_id: string
          source: Database["public"]["Enums"]["confidence_source"]
          source_attribution: Json | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_reason: string | null
          validation_status:
            | Database["public"]["Enums"]["field_validation_status"]
            | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          extraction_method?: string | null
          field_key: string
          id?: string
          product_id: string
          source?: Database["public"]["Enums"]["confidence_source"]
          source_attribution?: Json | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_reason?: string | null
          validation_status?:
            | Database["public"]["Enums"]["field_validation_status"]
            | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          extraction_method?: string | null
          field_key?: string
          id?: string
          product_id?: string
          source?: Database["public"]["Enums"]["confidence_source"]
          source_attribution?: Json | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_reason?: string | null
          validation_status?:
            | Database["public"]["Enums"]["field_validation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "product_field_confidence_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_insights: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          insight_payload: Json | null
          insight_type: Database["public"]["Enums"]["insight_type_enum"]
          priority: number | null
          product_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["insight_status_enum"] | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight_payload?: Json | null
          insight_type: Database["public"]["Enums"]["insight_type_enum"]
          priority?: number | null
          product_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["insight_status_enum"] | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight_payload?: Json | null
          insight_type?: Database["public"]["Enums"]["insight_type_enum"]
          priority?: number | null
          product_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["insight_status_enum"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_insights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_localizations: {
        Row: {
          created_at: string | null
          id: string
          locale: string
          needs_review: boolean | null
          product_id: string
          quality_score: number | null
          source_language: string | null
          status: string
          translated_description: string | null
          translated_faq: Json | null
          translated_image_alt_texts: Json | null
          translated_meta_description: string | null
          translated_meta_title: string | null
          translated_short_description: string | null
          translated_slug: string | null
          translated_tags: string[] | null
          translated_title: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          locale: string
          needs_review?: boolean | null
          product_id: string
          quality_score?: number | null
          source_language?: string | null
          status?: string
          translated_description?: string | null
          translated_faq?: Json | null
          translated_image_alt_texts?: Json | null
          translated_meta_description?: string | null
          translated_meta_title?: string | null
          translated_short_description?: string | null
          translated_slug?: string | null
          translated_tags?: string[] | null
          translated_title?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          locale?: string
          needs_review?: boolean | null
          product_id?: string
          quality_score?: number | null
          source_language?: string | null
          status?: string
          translated_description?: string | null
          translated_faq?: Json | null
          translated_image_alt_texts?: Json | null
          translated_meta_description?: string | null
          translated_meta_title?: string | null
          translated_short_description?: string | null
          translated_slug?: string | null
          translated_tags?: string[] | null
          translated_title?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_localizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_localizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_performance_metrics: {
        Row: {
          avg_position: number | null
          cart_additions: number | null
          channel_id: string | null
          clicks: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          orders: number | null
          product_id: string
          revenue: number | null
          updated_at: string | null
          views: number | null
          workspace_id: string
        }
        Insert: {
          avg_position?: number | null
          cart_additions?: number | null
          channel_id?: string | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          orders?: number | null
          product_id: string
          revenue?: number | null
          updated_at?: string | null
          views?: number | null
          workspace_id: string
        }
        Update: {
          avg_position?: number | null
          cart_additions?: number | null
          channel_id?: string | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          orders?: number | null
          product_id?: string
          revenue?: number | null
          updated_at?: string | null
          views?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_performance_metrics_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_quality_scores: {
        Row: {
          calculated_at: string
          completeness_score: number | null
          description_score: number | null
          id: string
          image_score: number | null
          overall_score: number | null
          price_score: number | null
          product_id: string
          schema_match_score: number | null
          seo_score: number | null
          title_score: number | null
        }
        Insert: {
          calculated_at?: string
          completeness_score?: number | null
          description_score?: number | null
          id?: string
          image_score?: number | null
          overall_score?: number | null
          price_score?: number | null
          product_id: string
          schema_match_score?: number | null
          seo_score?: number | null
          title_score?: number | null
        }
        Update: {
          calculated_at?: string
          completeness_score?: number | null
          description_score?: number | null
          id?: string
          image_score?: number | null
          overall_score?: number | null
          price_score?: number | null
          product_id?: string
          schema_match_score?: number | null
          seo_score?: number | null
          title_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_quality_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relationships: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          product_a_id: string | null
          product_b_id: string | null
          relationship_type:
            | Database["public"]["Enums"]["product_relationship_type"]
            | null
          source: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          product_a_id?: string | null
          product_b_id?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["product_relationship_type"]
            | null
          source?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          product_a_id?: string | null
          product_b_id?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["product_relationship_type"]
            | null
          source?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_relationships_product_a_id_fkey"
            columns: ["product_a_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relationships_product_b_id_fkey"
            columns: ["product_b_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relationships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_versions: {
        Row: {
          change_reason: string | null
          change_source: string | null
          created_at: string
          faq: Json | null
          id: string
          meta_description: string | null
          meta_title: string | null
          optimized_description: string | null
          optimized_price: number | null
          optimized_sale_price: number | null
          optimized_short_description: string | null
          optimized_title: string | null
          product_id: string
          seo_slug: string | null
          tags: string[] | null
          user_id: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          change_source?: string | null
          created_at?: string
          faq?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          optimized_description?: string | null
          optimized_price?: number | null
          optimized_sale_price?: number | null
          optimized_short_description?: string | null
          optimized_title?: string | null
          product_id: string
          seo_slug?: string | null
          tags?: string[] | null
          user_id: string
          version_number?: number
        }
        Update: {
          change_reason?: string | null
          change_source?: string | null
          created_at?: string
          faq?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          optimized_description?: string | null
          optimized_price?: number | null
          optimized_sale_price?: number | null
          optimized_short_description?: string | null
          optimized_title?: string | null
          product_id?: string
          seo_slug?: string | null
          tags?: string[] | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          category: string | null
          category_id: string | null
          created_at: string
          crosssell_skus: Json | null
          faq: Json | null
          focus_keyword: string[] | null
          id: string
          image_alt_texts: Json | null
          image_urls: string[] | null
          locked_for_publish: boolean | null
          meta_description: string | null
          meta_title: string | null
          optimized_description: string | null
          optimized_price: number | null
          optimized_sale_price: number | null
          optimized_short_description: string | null
          optimized_title: string | null
          original_description: string | null
          original_price: number | null
          original_title: string | null
          parent_product_id: string | null
          product_type: string
          quality_score: number | null
          sale_price: number | null
          seo_score: number | null
          seo_slug: string | null
          short_description: string | null
          sku: string | null
          source_file: string | null
          status: Database["public"]["Enums"]["product_status"]
          suggested_category: string | null
          supplier_ref: string | null
          tags: string[] | null
          technical_specs: string | null
          updated_at: string
          upsell_skus: Json | null
          user_id: string
          validation_errors: Json | null
          validation_status: string | null
          woocommerce_id: number | null
          workflow_changed_at: string | null
          workflow_changed_by: string | null
          workflow_state: Database["public"]["Enums"]["product_workflow"] | null
          workspace_id: string | null
        }
        Insert: {
          attributes?: Json | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          crosssell_skus?: Json | null
          faq?: Json | null
          focus_keyword?: string[] | null
          id?: string
          image_alt_texts?: Json | null
          image_urls?: string[] | null
          locked_for_publish?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          optimized_description?: string | null
          optimized_price?: number | null
          optimized_sale_price?: number | null
          optimized_short_description?: string | null
          optimized_title?: string | null
          original_description?: string | null
          original_price?: number | null
          original_title?: string | null
          parent_product_id?: string | null
          product_type?: string
          quality_score?: number | null
          sale_price?: number | null
          seo_score?: number | null
          seo_slug?: string | null
          short_description?: string | null
          sku?: string | null
          source_file?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          suggested_category?: string | null
          supplier_ref?: string | null
          tags?: string[] | null
          technical_specs?: string | null
          updated_at?: string
          upsell_skus?: Json | null
          user_id: string
          validation_errors?: Json | null
          validation_status?: string | null
          woocommerce_id?: number | null
          workflow_changed_at?: string | null
          workflow_changed_by?: string | null
          workflow_state?:
            | Database["public"]["Enums"]["product_workflow"]
            | null
          workspace_id?: string | null
        }
        Update: {
          attributes?: Json | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          crosssell_skus?: Json | null
          faq?: Json | null
          focus_keyword?: string[] | null
          id?: string
          image_alt_texts?: Json | null
          image_urls?: string[] | null
          locked_for_publish?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          optimized_description?: string | null
          optimized_price?: number | null
          optimized_sale_price?: number | null
          optimized_short_description?: string | null
          optimized_title?: string | null
          original_description?: string | null
          original_price?: number | null
          original_title?: string | null
          parent_product_id?: string | null
          product_type?: string
          quality_score?: number | null
          sale_price?: number | null
          seo_score?: number | null
          seo_slug?: string | null
          short_description?: string | null
          sku?: string | null
          source_file?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          suggested_category?: string | null
          supplier_ref?: string | null
          tags?: string[] | null
          technical_specs?: string | null
          updated_at?: string
          upsell_skus?: Json | null
          user_id?: string
          validation_errors?: Json | null
          validation_status?: string | null
          woocommerce_id?: number | null
          workflow_changed_at?: string | null
          workflow_changed_by?: string | null
          workflow_state?:
            | Database["public"]["Enums"]["product_workflow"]
            | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      promotion_candidates: {
        Row: {
          confidence: number | null
          created_at: string | null
          estimated_revenue_gain: number | null
          id: string
          product_id: string | null
          promotion_type: Database["public"]["Enums"]["promotion_type"] | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          estimated_revenue_gain?: number | null
          id?: string
          product_id?: string | null
          promotion_type?: Database["public"]["Enums"]["promotion_type"] | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          estimated_revenue_gain?: number | null
          id?: string
          product_id?: string | null
          promotion_type?: Database["public"]["Enums"]["promotion_type"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_candidates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_job_items: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          error_payload: Json | null
          id: string
          job_id: string
          max_retries: number | null
          product_id: string
          publish_fields: string[] | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_item_status"]
          woocommerce_id: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          id?: string
          job_id: string
          max_retries?: number | null
          product_id: string
          publish_fields?: string[] | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_item_status"]
          woocommerce_id?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          error_payload?: Json | null
          id?: string
          job_id?: string
          max_retries?: number | null
          product_id?: string
          publish_fields?: string[] | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_item_status"]
          woocommerce_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publish_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "publish_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_product_name: string | null
          error_message: string | null
          failed_products: number
          id: string
          pricing: Json | null
          processed_products: number
          product_ids: string[]
          publish_fields: string[] | null
          results: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          total_products: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_product_name?: string | null
          error_message?: string | null
          failed_products?: number
          id?: string
          pricing?: Json | null
          processed_products?: number
          product_ids?: string[]
          publish_fields?: string[] | null
          results?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          total_products?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_product_name?: string | null
          error_message?: string | null
          failed_products?: number
          id?: string
          pricing?: Json | null
          processed_products?: number
          product_ids?: string[]
          publish_fields?: string[] | null
          results?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          total_products?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publish_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_locks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lock_type: Database["public"]["Enums"]["publish_lock_type"]
          locked_at: string
          locked_by: string | null
          product_id: string
          reason: string
          unlocked_at: string | null
          unlocked_by: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lock_type?: Database["public"]["Enums"]["publish_lock_type"]
          locked_at?: string
          locked_by?: string | null
          product_id: string
          reason: string
          unlocked_at?: string | null
          unlocked_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lock_type?: Database["public"]["Enums"]["publish_lock_type"]
          locked_at?: string
          locked_by?: string | null
          product_id?: string
          reason?: string
          unlocked_at?: string | null
          unlocked_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publish_locks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_locks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_gate_results: {
        Row: {
          evaluated_at: string
          failures: Json | null
          gate_id: string
          id: string
          passed: boolean
          product_id: string
          score: number | null
        }
        Insert: {
          evaluated_at?: string
          failures?: Json | null
          gate_id: string
          id?: string
          passed?: boolean
          product_id: string
          score?: number | null
        }
        Update: {
          evaluated_at?: string
          failures?: Json | null
          gate_id?: string
          id?: string
          passed?: boolean
          product_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_gate_results_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "quality_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_gate_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_gates: {
        Row: {
          block_publish: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          rules: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          block_publish?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          rules?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          block_publish?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_gates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_actions: {
        Row: {
          action_payload: Json | null
          action_type: Database["public"]["Enums"]["revenue_action_type"] | null
          created_at: string | null
          executed_at: string | null
          expected_revenue: number | null
          id: string
          status: string | null
          workspace_id: string
        }
        Insert: {
          action_payload?: Json | null
          action_type?:
            | Database["public"]["Enums"]["revenue_action_type"]
            | null
          created_at?: string | null
          executed_at?: string | null
          expected_revenue?: number | null
          id?: string
          status?: string | null
          workspace_id: string
        }
        Update: {
          action_payload?: Json | null
          action_type?:
            | Database["public"]["Enums"]["revenue_action_type"]
            | null
          created_at?: string | null
          executed_at?: string | null
          expected_revenue?: number | null
          id?: string
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: number
          product_id: string
          reason: Database["public"]["Enums"]["review_reason"]
          resolved_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["review_status"]
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: number
          product_id: string
          reason: Database["public"]["Enums"]["review_reason"]
          resolved_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: number
          product_id?: string
          reason?: Database["public"]["Enums"]["review_reason"]
          resolved_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_cache: {
        Row: {
          content_html: string | null
          content_markdown: string | null
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          url: string
          url_hash: string
          workspace_id: string | null
        }
        Insert: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          url: string
          url_hash: string
          workspace_id?: string | null
        }
        Update: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          url?: string
          url_hash?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_cache_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_credits: {
        Row: {
          id: string
          monthly_limit: number
          reset_at: string
          updated_at: string
          used_this_month: number
          workspace_id: string
        }
        Insert: {
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          used_this_month?: number
          workspace_id: string
        }
        Update: {
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          used_this_month?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraping_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_recommendations: {
        Row: {
          confidence: number | null
          created_at: string | null
          difficulty_score: number | null
          id: string
          keyword_volume: number | null
          locale: string | null
          product_id: string | null
          recommended_keywords: string[] | null
          recommended_meta_description: string | null
          recommended_title: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          difficulty_score?: number | null
          id?: string
          keyword_volume?: number | null
          locale?: string | null
          product_id?: string | null
          recommended_keywords?: string[] | null
          recommended_meta_description?: string | null
          recommended_title?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          difficulty_score?: number | null
          id?: string
          keyword_volume?: number | null
          locale?: string | null
          product_id?: string | null
          recommended_keywords?: string[] | null
          recommended_meta_description?: string | null
          recommended_title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      strategy_actions: {
        Row: {
          action_payload: Json | null
          action_type: Database["public"]["Enums"]["strategy_action_type"]
          created_at: string
          expected_conversion: number | null
          expected_margin: number | null
          expected_revenue: number | null
          id: string
          plan_id: string
          priority_score: number | null
          status: Database["public"]["Enums"]["strategy_status"]
          target_category_id: string | null
          target_channel_id: string | null
          target_product_id: string | null
          workspace_id: string
        }
        Insert: {
          action_payload?: Json | null
          action_type: Database["public"]["Enums"]["strategy_action_type"]
          created_at?: string
          expected_conversion?: number | null
          expected_margin?: number | null
          expected_revenue?: number | null
          id?: string
          plan_id: string
          priority_score?: number | null
          status?: Database["public"]["Enums"]["strategy_status"]
          target_category_id?: string | null
          target_channel_id?: string | null
          target_product_id?: string | null
          workspace_id: string
        }
        Update: {
          action_payload?: Json | null
          action_type?: Database["public"]["Enums"]["strategy_action_type"]
          created_at?: string
          expected_conversion?: number | null
          expected_margin?: number | null
          expected_revenue?: number | null
          id?: string
          plan_id?: string
          priority_score?: number | null
          status?: Database["public"]["Enums"]["strategy_status"]
          target_category_id?: string | null
          target_channel_id?: string | null
          target_product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_actions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "strategy_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          plan_type: Database["public"]["Enums"]["strategy_plan_type"]
          planning_horizon_months: number | null
          status: Database["public"]["Enums"]["strategy_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["strategy_plan_type"]
          planning_horizon_months?: number | null
          status?: Database["public"]["Enums"]["strategy_status"]
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["strategy_plan_type"]
          planning_horizon_months?: number | null
          status?: Database["public"]["Enums"]["strategy_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_recommendations: {
        Row: {
          confidence: number | null
          created_at: string
          expected_impact: number | null
          id: string
          recommendation_payload: Json | null
          recommendation_type: string
          target_category_id: string | null
          target_product_id: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          expected_impact?: number | null
          id?: string
          recommendation_payload?: Json | null
          recommendation_type?: string
          target_category_id?: string | null
          target_product_id?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          expected_impact?: number | null
          id?: string
          recommendation_payload?: Json | null
          recommendation_type?: string
          target_category_id?: string | null
          target_product_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_simulations: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          plan_id: string
          predicted_conversion: number | null
          predicted_margin: number | null
          predicted_revenue: number | null
          simulation_payload: Json | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          plan_id: string
          predicted_conversion?: number | null
          predicted_margin?: number | null
          predicted_revenue?: number | null
          simulation_payload?: Json | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          plan_id?: string
          predicted_conversion?: number | null
          predicted_margin?: number | null
          predicted_revenue?: number | null
          simulation_payload?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_simulations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "strategy_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_simulations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_layout_profiles: {
        Row: {
          column_aliases: Json
          confidence_rules: Json
          created_at: string
          header_patterns: Json
          id: string
          language: string | null
          layout_signature: Json
          supplier_name: string
          table_patterns: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          column_aliases?: Json
          confidence_rules?: Json
          created_at?: string
          header_patterns?: Json
          id?: string
          language?: string | null
          layout_signature?: Json
          supplier_name: string
          table_patterns?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          column_aliases?: Json
          confidence_rules?: Json
          created_at?: string
          header_patterns?: Json
          id?: string
          language?: string | null
          layout_signature?: Json
          supplier_name?: string
          table_patterns?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_layout_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_symbol_dictionary: {
        Row: {
          examples: Json | null
          id: string
          normalized_field: string
          symbol: string
          unit: string | null
        }
        Insert: {
          examples?: Json | null
          id?: string
          normalized_field: string
          symbol: string
          unit?: string | null
        }
        Update: {
          examples?: Json | null
          id?: string
          normalized_field?: string
          symbol?: string
          unit?: string | null
        }
        Relationships: []
      }
      terminology_dictionaries: {
        Row: {
          category_id: string | null
          channel_id: string | null
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          source_locale: string
          source_term: string
          target_locale: string
          target_term: string
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          source_locale: string
          source_term: string
          target_locale: string
          target_term: string
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          source_locale?: string
          source_term?: string
          target_locale?: string
          target_term?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminology_dictionaries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminology_dictionaries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_job_items: {
        Row: {
          completed_at: string | null
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          fields_translated: string[] | null
          id: string
          job_id: string
          locale: string
          product_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          fields_translated?: string[] | null
          id?: string
          job_id: string
          locale: string
          product_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          fields_translated?: string[] | null
          id?: string
          job_id?: string
          locale?: string
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "translation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_job_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          failed_products: number | null
          id: string
          processed_products: number | null
          product_ids: string[]
          source_locale: string
          status: string
          target_locales: string[]
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          failed_products?: number | null
          id?: string
          processed_products?: number | null
          product_ids: string[]
          source_locale: string
          status?: string
          target_locales: string[]
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          failed_products?: number | null
          id?: string
          processed_products?: number | null
          product_ids?: string[]
          source_locale?: string
          status?: string
          target_locales?: string[]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_memories: {
        Row: {
          approved_by: string | null
          category_id: string | null
          confidence_score: number | null
          created_at: string | null
          field_type: string | null
          id: string
          source_locale: string
          source_text: string
          target_locale: string
          translated_text: string
          workspace_id: string
        }
        Insert: {
          approved_by?: string | null
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          field_type?: string | null
          id?: string
          source_locale: string
          source_text: string
          target_locale: string
          translated_text: string
          workspace_id: string
        }
        Update: {
          approved_by?: string | null
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          field_type?: string | null
          id?: string
          source_locale?: string
          source_text?: string
          target_locale?: string
          translated_text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_memories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_hash: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          metadata: Json | null
          products_count: number | null
          status: string
          storage_path: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_hash?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          metadata?: Json | null
          products_count?: number | null
          status?: string
          storage_path?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_hash?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          metadata?: Json | null
          products_count?: number | null
          status?: string
          storage_path?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_results: {
        Row: {
          actual_value: string | null
          channel_id: string | null
          details: Json
          expected: string | null
          id: string
          passed: boolean
          product_id: string
          rule_id: string | null
          schema_id: string | null
          severity: Database["public"]["Enums"]["validation_severity"]
          validated_at: string
        }
        Insert: {
          actual_value?: string | null
          channel_id?: string | null
          details?: Json
          expected?: string | null
          id?: string
          passed: boolean
          product_id: string
          rule_id?: string | null
          schema_id?: string | null
          severity: Database["public"]["Enums"]["validation_severity"]
          validated_at?: string
        }
        Update: {
          actual_value?: string | null
          channel_id?: string | null
          details?: Json
          expected?: string | null
          id?: string
          passed?: boolean
          product_id?: string
          rule_id?: string | null
          schema_id?: string | null
          severity?: Database["public"]["Enums"]["validation_severity"]
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_results_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "validation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_results_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "category_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_rules: {
        Row: {
          applies_to_channels: string[] | null
          applies_to_product_types: string[] | null
          created_at: string
          error_message_template: string | null
          field_key: string
          id: string
          is_active: boolean
          rule_config: Json
          rule_type: Database["public"]["Enums"]["validation_rule_type"]
          schema_id: string | null
          severity: Database["public"]["Enums"]["validation_severity"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          applies_to_channels?: string[] | null
          applies_to_product_types?: string[] | null
          created_at?: string
          error_message_template?: string | null
          field_key: string
          id?: string
          is_active?: boolean
          rule_config?: Json
          rule_type: Database["public"]["Enums"]["validation_rule_type"]
          schema_id?: string | null
          severity?: Database["public"]["Enums"]["validation_severity"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          applies_to_channels?: string[] | null
          applies_to_product_types?: string[] | null
          created_at?: string
          error_message_template?: string | null
          field_key?: string
          id?: string
          is_active?: boolean
          rule_config?: Json
          rule_type?: Database["public"]["Enums"]["validation_rule_type"]
          schema_id?: string | null
          severity?: Database["public"]["Enums"]["validation_severity"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_rules_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "category_schemas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          created_at: string
          from_state: Database["public"]["Enums"]["product_workflow"] | null
          id: string
          product_id: string
          reason: string | null
          to_state: Database["public"]["Enums"]["product_workflow"]
          trigger_source: string | null
          triggered_by: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          from_state?: Database["public"]["Enums"]["product_workflow"] | null
          id?: string
          product_id: string
          reason?: string | null
          to_state: Database["public"]["Enums"]["product_workflow"]
          trigger_source?: string | null
          triggered_by: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          from_state?: Database["public"]["Enums"]["product_workflow"] | null
          id?: string
          product_id?: string
          reason?: string | null
          to_state?: Database["public"]["Enums"]["product_workflow"]
          trigger_source?: string | null
          triggered_by?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_ai_settings: {
        Row: {
          brand_voice: string | null
          created_at: string
          custom_instructions: string | null
          default_model: string | null
          fallback_model: string | null
          id: string
          language: string | null
          max_tokens: number | null
          temperature: number | null
          tone: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand_voice?: string | null
          created_at?: string
          custom_instructions?: string | null
          default_model?: string | null
          fallback_model?: string | null
          id?: string
          language?: string | null
          max_tokens?: number | null
          temperature?: number | null
          tone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand_voice?: string | null
          created_at?: string
          custom_instructions?: string | null
          default_model?: string | null
          fallback_model?: string | null
          id?: string
          language?: string | null
          max_tokens?: number | null
          temperature?: number | null
          tone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_ai_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["workspace_invitation_status"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_invitation_status"]
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_invitation_status"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["workspace_member_status"]
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_member_status"]
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          email_recipients: string[] | null
          id: string
          notify_on_error: boolean | null
          notify_on_job_complete: boolean | null
          notify_on_publish: boolean | null
          telegram_chat_id: string | null
          telegram_enabled: boolean | null
          updated_at: string
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          email_recipients?: string[] | null
          id?: string
          notify_on_error?: boolean | null
          notify_on_job_complete?: boolean | null
          notify_on_publish?: boolean | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean | null
          updated_at?: string
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          email_recipients?: string[] | null
          id?: string
          notify_on_error?: boolean | null
          notify_on_job_complete?: boolean | null
          notify_on_publish?: boolean | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean | null
          updated_at?: string
          webhook_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_notification_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_prompt_profiles: {
        Row: {
          created_at: string
          examples: Json | null
          field_key: string
          id: string
          is_default: boolean | null
          language: string | null
          name: string
          system_prompt: string | null
          tone: string | null
          updated_at: string
          user_prompt_template: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          examples?: Json | null
          field_key: string
          id?: string
          is_default?: boolean | null
          language?: string | null
          name: string
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          user_prompt_template?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          examples?: Json | null
          field_key?: string
          id?: string
          is_default?: boolean | null
          language?: string | null
          name?: string
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          user_prompt_template?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_prompt_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_publish_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          pricing_rules: Json | null
          publish_fields: string[] | null
          sku_prefix_rules: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          pricing_rules?: Json | null
          publish_fields?: string[] | null
          sku_prefix_rules?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          pricing_rules?: Json | null
          publish_fields?: string[] | null
          sku_prefix_rules?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_publish_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_supplier_configs: {
        Row: {
          auto_enrich: boolean | null
          created_at: string
          field_mappings: Json | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          schedule_cron: string | null
          scrape_config: Json | null
          supplier_name: string
          supplier_url: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_enrich?: boolean | null
          created_at?: string
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          schedule_cron?: string | null
          scrape_config?: Json | null
          supplier_name: string
          supplier_url?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_enrich?: boolean | null
          created_at?: string
          field_mappings?: Json | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          schedule_cron?: string | null
          scrape_config?: Json | null
          supplier_name?: string
          supplier_url?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_supplier_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          default_language: string | null
          description: string | null
          has_variable_products: boolean
          id: string
          name: string
          plan_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_language?: string | null
          description?: string | null
          has_variable_products?: boolean
          id?: string
          name: string
          plan_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_language?: string | null
          description?: string | null
          has_variable_products?: boolean
          id?: string
          name?: string
          plan_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_workspace_content: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      can_manage_workspace: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      can_publish_in_workspace: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      compute_product_completeness_score: {
        Args: { _product_id: string }
        Returns: number
      }
      enqueue_product_for_review: {
        Args: {
          _priority?: number
          _product_id: string
          _reason: Database["public"]["Enums"]["review_reason"]
          _workspace_id: string
        }
        Returns: string
      }
      get_active_schema_for_product: {
        Args: { _product_id: string }
        Returns: {
          category_id: string | null
          channel_overrides: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          optional_fields: string[]
          required_fields: string[]
          schema_definition: Json
          updated_at: string
          variation_attributes: Json
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "category_schemas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_product_assets: {
        Args: {
          _channel_id?: string
          _product_id: string
          _usage_context?: Database["public"]["Enums"]["asset_usage_enum"]
        }
        Returns: {
          ai_alt_text: string
          asset_id: string
          asset_type: Database["public"]["Enums"]["asset_type_enum"]
          is_primary: boolean
          public_url: string
          sort_order: number
          source: string
          usage_context: Database["public"]["Enums"]["asset_usage_enum"]
        }[]
      }
      get_product_filter_options: {
        Args: { _workspace_id: string }
        Returns: {
          filter_type: string
          filter_value: string
        }[]
      }
      get_product_stats: {
        Args: { _workspace_id: string }
        Returns: {
          count: number
          status: string
        }[]
      }
      get_products_page: {
        Args: {
          _category?: string
          _page?: number
          _page_size?: number
          _product_type?: string
          _search?: string
          _source_file?: string
          _status?: string
          _woo_filter?: string
          _workspace_id: string
        }
        Returns: {
          attributes: Json
          category: string
          category_id: string
          created_at: string
          crosssell_skus: Json
          faq: Json
          focus_keyword: string[]
          id: string
          image_alt_texts: Json
          image_urls: string[]
          meta_description: string
          meta_title: string
          optimized_description: string
          optimized_price: number
          optimized_sale_price: number
          optimized_short_description: string
          optimized_title: string
          original_description: string
          original_price: number
          original_title: string
          parent_product_id: string
          product_type: string
          sale_price: number
          seo_score: number
          seo_slug: string
          short_description: string
          sku: string
          source_file: string
          status: Database["public"]["Enums"]["product_status"]
          suggested_category: string
          supplier_ref: string
          tags: string[]
          technical_specs: string
          total_count: number
          updated_at: string
          upsell_skus: Json
          user_id: string
          woocommerce_id: number
          workspace_id: string
        }[]
      }
      get_workspace_role: {
        Args: { _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_access: {
        Args: {
          _min_role: Database["public"]["Enums"]["workspace_role"]
          _workspace_id: string
        }
        Returns: boolean
      }
      has_workspace_access_hybrid: {
        Args: {
          _min_role: Database["public"]["Enums"]["workspace_role"]
          _workspace_id: string
        }
        Returns: boolean
      }
      increment_image_credits: {
        Args: { _workspace_id: string }
        Returns: undefined
      }
      increment_scraping_credits: {
        Args: { _workspace_id: string }
        Returns: undefined
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { _workspace_id: string }; Returns: boolean }
      search_knowledge:
        | {
            Args: { _limit?: number; _query: string }
            Returns: {
              content: string
              id: string
              rank: number
              source_name: string
            }[]
          }
        | {
            Args: { _limit?: number; _query: string; _workspace_id?: string }
            Returns: {
              content: string
              id: string
              rank: number
              source_name: string
            }[]
          }
      search_knowledge_hybrid: {
        Args: {
          _family_keywords?: string
          _limit?: number
          _query: string
          _workspace_id?: string
        }
        Returns: {
          content: string
          id: string
          match_type: string
          rank: number
          source_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      workspace_role_rank: {
        Args: { _role: Database["public"]["Enums"]["workspace_role"] }
        Returns: number
      }
    }
    Enums: {
      activity_action:
        | "upload"
        | "optimize"
        | "publish"
        | "settings_change"
        | "error"
      agent_action_type_enum:
        | "update_title"
        | "update_description"
        | "update_attributes"
        | "create_bundle"
        | "add_upsell"
        | "add_cross_sell"
        | "update_seo_fields"
        | "publish_to_channel"
        | "generate_translation"
        | "optimize_images"
        | "suggest_price_change"
      agent_schedule_enum: "manual" | "hourly" | "daily" | "weekly"
      agent_status_enum: "active" | "paused" | "disabled"
      agent_task_status_enum:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      agent_type_enum:
        | "seo_optimizer"
        | "catalog_gap_detector"
        | "bundle_generator"
        | "attribute_completeness_agent"
        | "feed_optimizer"
        | "translation_agent"
        | "image_optimizer"
        | "supplier_learning_agent"
        | "pricing_analyzer"
        | "channel_performance_agent"
      app_role: "admin" | "user"
      asset_review_status_enum: "unreviewed" | "approved" | "rejected"
      asset_source_enum: "upload" | "scrape" | "ai_generated" | "api" | "ocr"
      asset_status_enum:
        | "active"
        | "archived"
        | "processing"
        | "error"
        | "pending_review"
      asset_type_enum:
        | "original"
        | "optimized"
        | "lifestyle"
        | "technical"
        | "packshot"
        | "derived"
      asset_usage_enum:
        | "main"
        | "gallery"
        | "lifestyle"
        | "technical"
        | "seo"
        | "social"
      asset_variant_enum:
        | "thumbnail"
        | "medium"
        | "large"
        | "social"
        | "marketplace"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "publish"
        | "approve"
        | "reject"
        | "restore"
        | "optimize"
        | "enrich"
        | "import"
      audit_entity_type:
        | "product"
        | "category"
        | "channel"
        | "settings"
        | "member"
        | "workspace"
        | "asset"
        | "job"
      autonomous_action_status:
        | "pending"
        | "approved"
        | "scheduled"
        | "executing"
        | "completed"
        | "failed"
        | "cancelled"
      autonomous_action_type:
        | "create_bundle"
        | "update_price"
        | "create_promotion"
        | "add_cross_sell"
        | "add_upsell"
        | "create_product_pack"
        | "expand_category"
        | "optimize_listing"
      autonomous_execution_mode:
        | "manual"
        | "semi_autonomous"
        | "fully_autonomous"
      background_enum:
        | "white"
        | "transparent"
        | "lifestyle"
        | "custom"
        | "unknown"
      benchmark_metric:
        | "median_price"
        | "average_title_length"
        | "average_description_length"
        | "image_count"
        | "attribute_coverage"
        | "keyword_density"
        | "bundle_frequency"
      brain_cluster_type:
        | "performance_cluster"
        | "attribute_cluster"
        | "price_cluster"
        | "category_cluster"
        | "supplier_cluster"
        | "behavior_cluster"
        | "opportunity_cluster"
        | "technical_cluster"
        | "seo_cluster"
        | "visual_cluster"
        | "translation_cluster"
        | "monetization_cluster"
      brain_entity_type:
        | "product"
        | "category"
        | "supplier"
        | "channel"
        | "bundle"
        | "cluster"
        | "attribute"
        | "image"
        | "translation"
        | "product_family"
        | "variant"
        | "schema"
        | "asset"
        | "document"
        | "feed"
      brain_observation_type:
        | "quality_gate_fail"
        | "review_correction"
        | "seo_weakness"
        | "missing_attribute"
        | "channel_rejection"
        | "low_conversion"
        | "price_anomaly"
        | "image_issue"
        | "translation_gap"
        | "feed_error"
        | "duplicate_detected"
        | "supplier_signal"
        | "low_confidence"
        | "feed_rejection"
        | "high_conversion"
        | "poor_ctr"
        | "untranslated_content"
        | "image_quality_issue"
        | "schema_mismatch"
        | "supplier_pattern_detected"
      brain_outcome_type:
        | "improvement"
        | "degradation"
        | "neutral"
        | "pending_measurement"
        | "seo_score"
        | "quality_score"
        | "feed_acceptance"
        | "publish_success"
        | "ctr"
        | "conversion_rate"
        | "revenue"
        | "review_time"
        | "completion_rate"
      brain_plan_status:
        | "draft"
        | "ready"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
        | "queued"
        | "waiting_review"
      brain_relation_type:
        | "belongs_to"
        | "similar_to"
        | "complementary"
        | "competes_with"
        | "variant_of"
        | "accessory_for"
        | "bundled_with"
        | "upsell_for"
        | "cross_sell_for"
        | "same_supplier"
        | "same_category"
        | "belongs_to_family"
        | "has_variant"
        | "uses_schema"
        | "derived_from"
        | "sourced_from"
        | "related_bundle"
        | "translated_to"
        | "published_to"
        | "blocked_by"
        | "optimized_by"
      brain_step_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
      bundle_type_enum:
        | "frequently_bought_together"
        | "accessory_bundle"
        | "starter_kit"
        | "professional_bundle"
        | "upsell_bundle"
      channel_job_status_enum: "queued" | "running" | "completed" | "failed"
      channel_rule_type_enum:
        | "title_template"
        | "description_template"
        | "exclude_product"
        | "require_attribute"
        | "fallback_attribute"
        | "category_override"
        | "price_adjustment"
        | "image_selection"
        | "variant_strategy"
        | "feed_cleanup"
        | "stock_policy"
        | "shipping_policy"
        | "validation_rule"
      channel_type_enum:
        | "woocommerce"
        | "shopify"
        | "amazon"
        | "google_merchant"
        | "csv_export"
        | "api_endpoint"
        | "marketplace"
      confidence_source: "ai" | "human" | "import" | "scrape" | "ocr" | "api"
      correction_type:
        | "value_fix"
        | "column_reassignment"
        | "category_fix"
        | "attribute_fix"
        | "variation_fix"
        | "unit_fix"
        | "grouping_fix"
        | "image_fix"
      decision_priority_level: "low" | "medium" | "high" | "critical"
      decision_signal_type:
        | "quality_issue"
        | "seo_opportunity"
        | "channel_rejection"
        | "missing_translation"
        | "image_quality_problem"
        | "bundle_opportunity"
        | "upsell_opportunity"
        | "supplier_pattern"
        | "pricing_opportunity"
        | "data_inconsistency"
        | "feed_error"
        | "schema_mismatch"
        | "duplicate_product"
      decision_status:
        | "pending"
        | "approved"
        | "rejected"
        | "executed"
        | "expired"
      demand_signal_type:
        | "search_volume"
        | "keyword_trend"
        | "click_through_rate"
        | "conversion_rate"
        | "ad_cost"
        | "keyword_gap"
        | "demand_spike"
      demand_source_type:
        | "search_console"
        | "google_ads"
        | "analytics"
        | "site_search"
        | "marketplace_search"
        | "external_keyword_data"
      extraction_decision_type:
        | "category_assignment"
        | "schema_assignment"
        | "variation_grouping"
        | "parent_child_resolution"
        | "attribute_selection"
        | "table_classification"
        | "image_to_product_matching"
      extraction_pattern_source:
        | "ai_inferred"
        | "human_confirmed"
        | "import_observed"
        | "publish_validated"
        | "system_generated"
      extraction_pattern_type:
        | "column_mapping"
        | "header_alias"
        | "table_layout"
        | "unit_normalization"
        | "attribute_mapping"
        | "category_mapping"
        | "grouping_rule"
        | "variation_rule"
        | "image_association_rule"
        | "language_pattern"
        | "supplier_rule"
        | "pdf_section_rule"
      feed_type_enum:
        | "marketplace"
        | "merchant_feed"
        | "partner_csv"
        | "internal_api"
        | "retailer_feed"
      field_validation_status: "valid" | "invalid" | "unvalidated"
      gap_type_enum:
        | "missing_product_family"
        | "missing_variation"
        | "missing_accessory"
        | "missing_bundle"
        | "missing_supplier_range"
      gate_severity: "error" | "warning" | "info"
      image_job_item_status:
        | "queued"
        | "processing"
        | "done"
        | "error"
        | "skipped"
      image_job_status: "queued" | "processing" | "done" | "error"
      image_operation_enum:
        | "download"
        | "optimize"
        | "background_remove"
        | "resize"
      image_status:
        | "pending"
        | "downloading"
        | "optimizing"
        | "uploading"
        | "done"
        | "error"
      impact_dimension:
        | "revenue"
        | "conversion"
        | "seo_visibility"
        | "channel_compliance"
        | "catalog_quality"
        | "automation_efficiency"
      ingestion_action_type:
        | "insert"
        | "update"
        | "skip"
        | "merge"
        | "duplicate"
      ingestion_item_status:
        | "queued"
        | "parsed"
        | "mapped"
        | "processed"
        | "skipped"
        | "error"
      ingestion_job_status:
        | "queued"
        | "parsing"
        | "mapping"
        | "dry_run"
        | "importing"
        | "done"
        | "error"
      ingestion_merge_strategy:
        | "insert_only"
        | "update_only"
        | "merge"
        | "replace"
      ingestion_mode: "dry_run" | "live"
      ingestion_source_type:
        | "csv"
        | "xlsx"
        | "xml"
        | "json"
        | "google_sheets"
        | "api"
        | "webhook"
        | "supplier_feed"
      insight_status_enum: "open" | "accepted" | "ignored" | "implemented"
      insight_type_enum:
        | "seo_improvement"
        | "title_optimization"
        | "description_improvement"
        | "missing_attribute"
        | "image_quality_issue"
        | "category_mismatch"
        | "bundle_opportunity"
        | "upsell_opportunity"
        | "cross_sell_opportunity"
        | "price_anomaly"
        | "channel_rejection_risk"
        | "missing_translation"
        | "catalog_gap"
        | "keyword_opportunity"
      job_item_status: "queued" | "processing" | "done" | "error" | "skipped"
      learning_feedback_type:
        | "explicit_feedback"
        | "implicit_feedback"
        | "system_observation"
      learning_model_type:
        | "impact_weight_adjustment"
        | "decision_pattern_learning"
        | "supplier_pattern_learning"
        | "channel_behavior_learning"
        | "translation_quality_learning"
        | "bundle_success_learning"
      learning_outcome_type: "positive" | "neutral" | "negative"
      learning_signal_type:
        | "human_approval"
        | "human_rejection"
        | "performance_improvement"
        | "performance_degradation"
        | "channel_acceptance"
        | "channel_rejection"
        | "seo_improvement"
        | "conversion_change"
        | "revenue_change"
        | "workflow_speed"
      learning_source_enum:
        | "rejection_pattern"
        | "validation_failure"
        | "manual_review"
        | "ai_detection"
        | "feed_analysis"
      market_opportunity_type:
        | "price_adjustment"
        | "seo_improvement"
        | "content_enrichment"
        | "image_upgrade"
        | "bundle_creation"
        | "taxonomy_update"
        | "channel_expansion"
      market_signal_type:
        | "price_competitiveness"
        | "seo_alignment"
        | "content_gap"
        | "image_gap"
        | "bundle_opportunity"
        | "pricing_opportunity"
        | "category_gap"
        | "attribute_gap"
        | "keyword_opportunity"
        | "market_trend"
      market_source_type:
        | "competitor_site"
        | "google_serp"
        | "google_shopping"
        | "marketplace"
        | "supplier_feed"
        | "public_catalog"
        | "price_comparison"
      normalization_type:
        | "unit"
        | "material"
        | "color"
        | "category"
        | "attribute_name"
        | "attribute_value"
        | "product_family"
        | "brand_alias"
      opportunity_type_enum:
        | "missing_upsell"
        | "missing_cross_sell"
        | "missing_bundle"
        | "low_visibility"
        | "low_conversion"
        | "underpriced_product"
      pdf_block_role:
        | "product_family"
        | "product_group"
        | "table_header"
        | "table_row"
        | "table_cell"
        | "description"
        | "attribute"
        | "context_label"
      pdf_block_type:
        | "header"
        | "section_title"
        | "paragraph"
        | "table"
        | "image"
        | "caption"
        | "footer"
        | "note"
      pdf_extraction_method: "text_only" | "vision_only" | "hybrid"
      pdf_extraction_status:
        | "queued"
        | "extracting"
        | "reviewing"
        | "done"
        | "error"
      pdf_image_type:
        | "product"
        | "lifestyle"
        | "technical"
        | "icon"
        | "logo"
        | "unknown"
      pdf_page_status: "extracted" | "reviewed" | "approved"
      pdf_row_status: "unmapped" | "mapped" | "skipped" | "error"
      pdf_table_type:
        | "product_table"
        | "technical_specs"
        | "pricing_table"
        | "accessories"
        | "compatibility"
        | "spare_parts"
      product_relationship_type:
        | "complementary"
        | "accessory"
        | "upgrade"
        | "substitute"
        | "bundle_candidate"
        | "cross_sell"
        | "upsell"
      product_status:
        | "pending"
        | "processing"
        | "optimized"
        | "published"
        | "error"
        | "needs_review"
      product_workflow:
        | "draft"
        | "enriching"
        | "review"
        | "approved"
        | "publishing"
        | "published"
        | "archived"
        | "rejected"
      promotion_type:
        | "discount"
        | "bundle_offer"
        | "limited_time_offer"
        | "volume_discount"
        | "channel_promotion"
      publish_lock_type:
        | "quality_gate"
        | "manual"
        | "validation"
        | "missing_data"
      revenue_action_type:
        | "create_bundle"
        | "add_cross_sell"
        | "add_upsell"
        | "adjust_price"
        | "launch_promotion"
        | "create_product_pack"
      review_reason:
        | "low_confidence"
        | "ai_generated"
        | "missing_fields"
        | "quality_gate_fail"
        | "validation_fail"
        | "human_requested"
      review_status: "pending" | "in_review" | "approved" | "rejected"
      risk_level: "low" | "medium" | "high"
      simulation_result_type:
        | "expected_improvement"
        | "expected_decline"
        | "neutral"
      simulation_status: "pending" | "running" | "completed" | "failed"
      simulation_type:
        | "seo_simulation"
        | "feed_validation_simulation"
        | "conversion_simulation"
        | "pricing_simulation"
        | "bundle_simulation"
        | "translation_quality_simulation"
        | "image_quality_simulation"
        | "schema_validation_simulation"
      strategy_action_type:
        | "launch_product"
        | "expand_category"
        | "create_bundle"
        | "run_promotion"
        | "optimize_price"
        | "improve_content"
        | "add_cross_sell"
        | "add_upsell"
      strategy_plan_type:
        | "quarterly_plan"
        | "category_strategy"
        | "launch_plan"
        | "promotion_strategy"
        | "channel_strategy"
      strategy_status:
        | "draft"
        | "simulated"
        | "approved"
        | "scheduled"
        | "executing"
        | "completed"
        | "cancelled"
      twin_entity_type:
        | "product"
        | "product_family"
        | "variant"
        | "category"
        | "asset"
        | "channel"
        | "schema"
        | "bundle"
        | "translation"
      twin_result_type: "expected_improvement" | "expected_decline" | "neutral"
      twin_scenario_status:
        | "draft"
        | "running"
        | "completed"
        | "failed"
        | "promoted"
      twin_scenario_type:
        | "seo_optimization"
        | "bundle_creation"
        | "price_adjustment"
        | "taxonomy_change"
        | "translation_rollout"
        | "image_replacement"
        | "channel_publish"
        | "schema_update"
        | "catalog_reorganization"
      validation_rule_type:
        | "required"
        | "regex"
        | "min_length"
        | "max_length"
        | "min_value"
        | "max_value"
        | "min_items"
        | "max_items"
        | "enum"
        | "not_empty"
        | "json_schema"
        | "custom"
      validation_severity: "error" | "warning" | "info"
      workspace_invitation_status:
        | "pending"
        | "accepted"
        | "expired"
        | "revoked"
      workspace_member_status: "pending" | "active" | "revoked"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_action: [
        "upload",
        "optimize",
        "publish",
        "settings_change",
        "error",
      ],
      agent_action_type_enum: [
        "update_title",
        "update_description",
        "update_attributes",
        "create_bundle",
        "add_upsell",
        "add_cross_sell",
        "update_seo_fields",
        "publish_to_channel",
        "generate_translation",
        "optimize_images",
        "suggest_price_change",
      ],
      agent_schedule_enum: ["manual", "hourly", "daily", "weekly"],
      agent_status_enum: ["active", "paused", "disabled"],
      agent_task_status_enum: [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      agent_type_enum: [
        "seo_optimizer",
        "catalog_gap_detector",
        "bundle_generator",
        "attribute_completeness_agent",
        "feed_optimizer",
        "translation_agent",
        "image_optimizer",
        "supplier_learning_agent",
        "pricing_analyzer",
        "channel_performance_agent",
      ],
      app_role: ["admin", "user"],
      asset_review_status_enum: ["unreviewed", "approved", "rejected"],
      asset_source_enum: ["upload", "scrape", "ai_generated", "api", "ocr"],
      asset_status_enum: [
        "active",
        "archived",
        "processing",
        "error",
        "pending_review",
      ],
      asset_type_enum: [
        "original",
        "optimized",
        "lifestyle",
        "technical",
        "packshot",
        "derived",
      ],
      asset_usage_enum: [
        "main",
        "gallery",
        "lifestyle",
        "technical",
        "seo",
        "social",
      ],
      asset_variant_enum: [
        "thumbnail",
        "medium",
        "large",
        "social",
        "marketplace",
      ],
      audit_action: [
        "create",
        "update",
        "delete",
        "publish",
        "approve",
        "reject",
        "restore",
        "optimize",
        "enrich",
        "import",
      ],
      audit_entity_type: [
        "product",
        "category",
        "channel",
        "settings",
        "member",
        "workspace",
        "asset",
        "job",
      ],
      autonomous_action_status: [
        "pending",
        "approved",
        "scheduled",
        "executing",
        "completed",
        "failed",
        "cancelled",
      ],
      autonomous_action_type: [
        "create_bundle",
        "update_price",
        "create_promotion",
        "add_cross_sell",
        "add_upsell",
        "create_product_pack",
        "expand_category",
        "optimize_listing",
      ],
      autonomous_execution_mode: [
        "manual",
        "semi_autonomous",
        "fully_autonomous",
      ],
      background_enum: [
        "white",
        "transparent",
        "lifestyle",
        "custom",
        "unknown",
      ],
      benchmark_metric: [
        "median_price",
        "average_title_length",
        "average_description_length",
        "image_count",
        "attribute_coverage",
        "keyword_density",
        "bundle_frequency",
      ],
      brain_cluster_type: [
        "performance_cluster",
        "attribute_cluster",
        "price_cluster",
        "category_cluster",
        "supplier_cluster",
        "behavior_cluster",
        "opportunity_cluster",
        "technical_cluster",
        "seo_cluster",
        "visual_cluster",
        "translation_cluster",
        "monetization_cluster",
      ],
      brain_entity_type: [
        "product",
        "category",
        "supplier",
        "channel",
        "bundle",
        "cluster",
        "attribute",
        "image",
        "translation",
        "product_family",
        "variant",
        "schema",
        "asset",
        "document",
        "feed",
      ],
      brain_observation_type: [
        "quality_gate_fail",
        "review_correction",
        "seo_weakness",
        "missing_attribute",
        "channel_rejection",
        "low_conversion",
        "price_anomaly",
        "image_issue",
        "translation_gap",
        "feed_error",
        "duplicate_detected",
        "supplier_signal",
        "low_confidence",
        "feed_rejection",
        "high_conversion",
        "poor_ctr",
        "untranslated_content",
        "image_quality_issue",
        "schema_mismatch",
        "supplier_pattern_detected",
      ],
      brain_outcome_type: [
        "improvement",
        "degradation",
        "neutral",
        "pending_measurement",
        "seo_score",
        "quality_score",
        "feed_acceptance",
        "publish_success",
        "ctr",
        "conversion_rate",
        "revenue",
        "review_time",
        "completion_rate",
      ],
      brain_plan_status: [
        "draft",
        "ready",
        "running",
        "completed",
        "failed",
        "cancelled",
        "queued",
        "waiting_review",
      ],
      brain_relation_type: [
        "belongs_to",
        "similar_to",
        "complementary",
        "competes_with",
        "variant_of",
        "accessory_for",
        "bundled_with",
        "upsell_for",
        "cross_sell_for",
        "same_supplier",
        "same_category",
        "belongs_to_family",
        "has_variant",
        "uses_schema",
        "derived_from",
        "sourced_from",
        "related_bundle",
        "translated_to",
        "published_to",
        "blocked_by",
        "optimized_by",
      ],
      brain_step_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
      ],
      bundle_type_enum: [
        "frequently_bought_together",
        "accessory_bundle",
        "starter_kit",
        "professional_bundle",
        "upsell_bundle",
      ],
      channel_job_status_enum: ["queued", "running", "completed", "failed"],
      channel_rule_type_enum: [
        "title_template",
        "description_template",
        "exclude_product",
        "require_attribute",
        "fallback_attribute",
        "category_override",
        "price_adjustment",
        "image_selection",
        "variant_strategy",
        "feed_cleanup",
        "stock_policy",
        "shipping_policy",
        "validation_rule",
      ],
      channel_type_enum: [
        "woocommerce",
        "shopify",
        "amazon",
        "google_merchant",
        "csv_export",
        "api_endpoint",
        "marketplace",
      ],
      confidence_source: ["ai", "human", "import", "scrape", "ocr", "api"],
      correction_type: [
        "value_fix",
        "column_reassignment",
        "category_fix",
        "attribute_fix",
        "variation_fix",
        "unit_fix",
        "grouping_fix",
        "image_fix",
      ],
      decision_priority_level: ["low", "medium", "high", "critical"],
      decision_signal_type: [
        "quality_issue",
        "seo_opportunity",
        "channel_rejection",
        "missing_translation",
        "image_quality_problem",
        "bundle_opportunity",
        "upsell_opportunity",
        "supplier_pattern",
        "pricing_opportunity",
        "data_inconsistency",
        "feed_error",
        "schema_mismatch",
        "duplicate_product",
      ],
      decision_status: [
        "pending",
        "approved",
        "rejected",
        "executed",
        "expired",
      ],
      demand_signal_type: [
        "search_volume",
        "keyword_trend",
        "click_through_rate",
        "conversion_rate",
        "ad_cost",
        "keyword_gap",
        "demand_spike",
      ],
      demand_source_type: [
        "search_console",
        "google_ads",
        "analytics",
        "site_search",
        "marketplace_search",
        "external_keyword_data",
      ],
      extraction_decision_type: [
        "category_assignment",
        "schema_assignment",
        "variation_grouping",
        "parent_child_resolution",
        "attribute_selection",
        "table_classification",
        "image_to_product_matching",
      ],
      extraction_pattern_source: [
        "ai_inferred",
        "human_confirmed",
        "import_observed",
        "publish_validated",
        "system_generated",
      ],
      extraction_pattern_type: [
        "column_mapping",
        "header_alias",
        "table_layout",
        "unit_normalization",
        "attribute_mapping",
        "category_mapping",
        "grouping_rule",
        "variation_rule",
        "image_association_rule",
        "language_pattern",
        "supplier_rule",
        "pdf_section_rule",
      ],
      feed_type_enum: [
        "marketplace",
        "merchant_feed",
        "partner_csv",
        "internal_api",
        "retailer_feed",
      ],
      field_validation_status: ["valid", "invalid", "unvalidated"],
      gap_type_enum: [
        "missing_product_family",
        "missing_variation",
        "missing_accessory",
        "missing_bundle",
        "missing_supplier_range",
      ],
      gate_severity: ["error", "warning", "info"],
      image_job_item_status: [
        "queued",
        "processing",
        "done",
        "error",
        "skipped",
      ],
      image_job_status: ["queued", "processing", "done", "error"],
      image_operation_enum: [
        "download",
        "optimize",
        "background_remove",
        "resize",
      ],
      image_status: [
        "pending",
        "downloading",
        "optimizing",
        "uploading",
        "done",
        "error",
      ],
      impact_dimension: [
        "revenue",
        "conversion",
        "seo_visibility",
        "channel_compliance",
        "catalog_quality",
        "automation_efficiency",
      ],
      ingestion_action_type: ["insert", "update", "skip", "merge", "duplicate"],
      ingestion_item_status: [
        "queued",
        "parsed",
        "mapped",
        "processed",
        "skipped",
        "error",
      ],
      ingestion_job_status: [
        "queued",
        "parsing",
        "mapping",
        "dry_run",
        "importing",
        "done",
        "error",
      ],
      ingestion_merge_strategy: [
        "insert_only",
        "update_only",
        "merge",
        "replace",
      ],
      ingestion_mode: ["dry_run", "live"],
      ingestion_source_type: [
        "csv",
        "xlsx",
        "xml",
        "json",
        "google_sheets",
        "api",
        "webhook",
        "supplier_feed",
      ],
      insight_status_enum: ["open", "accepted", "ignored", "implemented"],
      insight_type_enum: [
        "seo_improvement",
        "title_optimization",
        "description_improvement",
        "missing_attribute",
        "image_quality_issue",
        "category_mismatch",
        "bundle_opportunity",
        "upsell_opportunity",
        "cross_sell_opportunity",
        "price_anomaly",
        "channel_rejection_risk",
        "missing_translation",
        "catalog_gap",
        "keyword_opportunity",
      ],
      job_item_status: ["queued", "processing", "done", "error", "skipped"],
      learning_feedback_type: [
        "explicit_feedback",
        "implicit_feedback",
        "system_observation",
      ],
      learning_model_type: [
        "impact_weight_adjustment",
        "decision_pattern_learning",
        "supplier_pattern_learning",
        "channel_behavior_learning",
        "translation_quality_learning",
        "bundle_success_learning",
      ],
      learning_outcome_type: ["positive", "neutral", "negative"],
      learning_signal_type: [
        "human_approval",
        "human_rejection",
        "performance_improvement",
        "performance_degradation",
        "channel_acceptance",
        "channel_rejection",
        "seo_improvement",
        "conversion_change",
        "revenue_change",
        "workflow_speed",
      ],
      learning_source_enum: [
        "rejection_pattern",
        "validation_failure",
        "manual_review",
        "ai_detection",
        "feed_analysis",
      ],
      market_opportunity_type: [
        "price_adjustment",
        "seo_improvement",
        "content_enrichment",
        "image_upgrade",
        "bundle_creation",
        "taxonomy_update",
        "channel_expansion",
      ],
      market_signal_type: [
        "price_competitiveness",
        "seo_alignment",
        "content_gap",
        "image_gap",
        "bundle_opportunity",
        "pricing_opportunity",
        "category_gap",
        "attribute_gap",
        "keyword_opportunity",
        "market_trend",
      ],
      market_source_type: [
        "competitor_site",
        "google_serp",
        "google_shopping",
        "marketplace",
        "supplier_feed",
        "public_catalog",
        "price_comparison",
      ],
      normalization_type: [
        "unit",
        "material",
        "color",
        "category",
        "attribute_name",
        "attribute_value",
        "product_family",
        "brand_alias",
      ],
      opportunity_type_enum: [
        "missing_upsell",
        "missing_cross_sell",
        "missing_bundle",
        "low_visibility",
        "low_conversion",
        "underpriced_product",
      ],
      pdf_block_role: [
        "product_family",
        "product_group",
        "table_header",
        "table_row",
        "table_cell",
        "description",
        "attribute",
        "context_label",
      ],
      pdf_block_type: [
        "header",
        "section_title",
        "paragraph",
        "table",
        "image",
        "caption",
        "footer",
        "note",
      ],
      pdf_extraction_method: ["text_only", "vision_only", "hybrid"],
      pdf_extraction_status: [
        "queued",
        "extracting",
        "reviewing",
        "done",
        "error",
      ],
      pdf_image_type: [
        "product",
        "lifestyle",
        "technical",
        "icon",
        "logo",
        "unknown",
      ],
      pdf_page_status: ["extracted", "reviewed", "approved"],
      pdf_row_status: ["unmapped", "mapped", "skipped", "error"],
      pdf_table_type: [
        "product_table",
        "technical_specs",
        "pricing_table",
        "accessories",
        "compatibility",
        "spare_parts",
      ],
      product_relationship_type: [
        "complementary",
        "accessory",
        "upgrade",
        "substitute",
        "bundle_candidate",
        "cross_sell",
        "upsell",
      ],
      product_status: [
        "pending",
        "processing",
        "optimized",
        "published",
        "error",
        "needs_review",
      ],
      product_workflow: [
        "draft",
        "enriching",
        "review",
        "approved",
        "publishing",
        "published",
        "archived",
        "rejected",
      ],
      promotion_type: [
        "discount",
        "bundle_offer",
        "limited_time_offer",
        "volume_discount",
        "channel_promotion",
      ],
      publish_lock_type: [
        "quality_gate",
        "manual",
        "validation",
        "missing_data",
      ],
      revenue_action_type: [
        "create_bundle",
        "add_cross_sell",
        "add_upsell",
        "adjust_price",
        "launch_promotion",
        "create_product_pack",
      ],
      review_reason: [
        "low_confidence",
        "ai_generated",
        "missing_fields",
        "quality_gate_fail",
        "validation_fail",
        "human_requested",
      ],
      review_status: ["pending", "in_review", "approved", "rejected"],
      risk_level: ["low", "medium", "high"],
      simulation_result_type: [
        "expected_improvement",
        "expected_decline",
        "neutral",
      ],
      simulation_status: ["pending", "running", "completed", "failed"],
      simulation_type: [
        "seo_simulation",
        "feed_validation_simulation",
        "conversion_simulation",
        "pricing_simulation",
        "bundle_simulation",
        "translation_quality_simulation",
        "image_quality_simulation",
        "schema_validation_simulation",
      ],
      strategy_action_type: [
        "launch_product",
        "expand_category",
        "create_bundle",
        "run_promotion",
        "optimize_price",
        "improve_content",
        "add_cross_sell",
        "add_upsell",
      ],
      strategy_plan_type: [
        "quarterly_plan",
        "category_strategy",
        "launch_plan",
        "promotion_strategy",
        "channel_strategy",
      ],
      strategy_status: [
        "draft",
        "simulated",
        "approved",
        "scheduled",
        "executing",
        "completed",
        "cancelled",
      ],
      twin_entity_type: [
        "product",
        "product_family",
        "variant",
        "category",
        "asset",
        "channel",
        "schema",
        "bundle",
        "translation",
      ],
      twin_result_type: ["expected_improvement", "expected_decline", "neutral"],
      twin_scenario_status: [
        "draft",
        "running",
        "completed",
        "failed",
        "promoted",
      ],
      twin_scenario_type: [
        "seo_optimization",
        "bundle_creation",
        "price_adjustment",
        "taxonomy_change",
        "translation_rollout",
        "image_replacement",
        "channel_publish",
        "schema_update",
        "catalog_reorganization",
      ],
      validation_rule_type: [
        "required",
        "regex",
        "min_length",
        "max_length",
        "min_value",
        "max_value",
        "min_items",
        "max_items",
        "enum",
        "not_empty",
        "json_schema",
        "custom",
      ],
      validation_severity: ["error", "warning", "info"],
      workspace_invitation_status: [
        "pending",
        "accepted",
        "expired",
        "revoked",
      ],
      workspace_member_status: ["pending", "active", "revoked"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
