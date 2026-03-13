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
      background_enum:
        | "white"
        | "transparent"
        | "lifestyle"
        | "custom"
        | "unknown"
      confidence_source: "ai" | "human" | "import" | "scrape" | "ocr" | "api"
      field_validation_status: "valid" | "invalid" | "unvalidated"
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
      job_item_status: "queued" | "processing" | "done" | "error" | "skipped"
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
      publish_lock_type:
        | "quality_gate"
        | "manual"
        | "validation"
        | "missing_data"
      review_reason:
        | "low_confidence"
        | "ai_generated"
        | "missing_fields"
        | "quality_gate_fail"
        | "validation_fail"
        | "human_requested"
      review_status: "pending" | "in_review" | "approved" | "rejected"
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
      background_enum: [
        "white",
        "transparent",
        "lifestyle",
        "custom",
        "unknown",
      ],
      confidence_source: ["ai", "human", "import", "scrape", "ocr", "api"],
      field_validation_status: ["valid", "invalid", "unvalidated"],
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
      job_item_status: ["queued", "processing", "done", "error", "skipped"],
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
      publish_lock_type: [
        "quality_gate",
        "manual",
        "validation",
        "missing_data",
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
