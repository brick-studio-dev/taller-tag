--
-- PostgreSQL database dump
--

\restrict hKHOva3NOCMG5ijtcHJF4GLi9c6PQwdXi6m0YeK8500xqtVlfF216U5N1xTgnuN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: actualizar_subtotal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_subtotal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE reparaciones
  SET subtotal = (
    SELECT COALESCE(SUM(importe), 0)
    FROM lineas_reparacion
    WHERE reparacion_id = COALESCE(NEW.reparacion_id, OLD.reparacion_id)
  )
  WHERE id = COALESCE(NEW.reparacion_id, OLD.reparacion_id);
  RETURN NEW;
END;
$$;


--
-- Name: calcular_importe_linea(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_importe_linea() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.importe = ROUND(NEW.cantidad * NEW.precio_unitario * (1 - COALESCE(NEW.descuento_pct,0)/100), 2);
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombre text NOT NULL,
    apellidos text DEFAULT ''::text NOT NULL,
    dni_nif text,
    telefono text,
    email text,
    direccion text,
    ciudad text,
    codigo_postal text,
    notas text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lineas_reparacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lineas_reparacion (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    reparacion_id uuid NOT NULL,
    tipo text DEFAULT 'otro'::text NOT NULL,
    descripcion text NOT NULL,
    referencia text,
    cantidad numeric(10,3) DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) DEFAULT 0 NOT NULL,
    descuento_pct numeric(5,2) DEFAULT 0,
    importe numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reparaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reparaciones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    vehiculo_id uuid NOT NULL,
    numero_orden integer NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    fecha_entrada date DEFAULT CURRENT_DATE NOT NULL,
    fecha_salida date,
    kilometros_entrada integer,
    descripcion_averia text NOT NULL,
    trabajos_realizados text,
    observaciones text,
    subtotal numeric(10,2) DEFAULT 0,
    pagado boolean DEFAULT false,
    fecha_pago date,
    forma_pago text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total numeric(10,2) GENERATED ALWAYS AS (subtotal) STORED
);


--
-- Name: reparaciones_numero_orden_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reparaciones_numero_orden_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reparaciones_numero_orden_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reparaciones_numero_orden_seq OWNED BY public.reparaciones.numero_orden;


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    matricula text NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    version text,
    color text,
    anio integer,
    bastidor text,
    tipo_combustible text,
    potencia_cv integer,
    kilometraje integer DEFAULT 0,
    ultima_itv date,
    proxima_itv date,
    seguro_compania text,
    seguro_vencimiento date,
    notas text,
    foto_url text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reparaciones numero_orden; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reparaciones ALTER COLUMN numero_orden SET DEFAULT nextval('public.reparaciones_numero_orden_seq'::regclass);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: lineas_reparacion lineas_reparacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lineas_reparacion
    ADD CONSTRAINT lineas_reparacion_pkey PRIMARY KEY (id);


--
-- Name: reparaciones reparaciones_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reparaciones
    ADD CONSTRAINT reparaciones_numero_orden_key UNIQUE (numero_orden);


--
-- Name: reparaciones reparaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reparaciones
    ADD CONSTRAINT reparaciones_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_matricula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_matricula_key UNIQUE (matricula);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: lineas_reparacion trg_actualizar_subtotal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_actualizar_subtotal AFTER INSERT OR DELETE OR UPDATE ON public.lineas_reparacion FOR EACH ROW EXECUTE FUNCTION public.actualizar_subtotal();


--
-- Name: lineas_reparacion trg_calcular_importe; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calcular_importe BEFORE INSERT OR UPDATE ON public.lineas_reparacion FOR EACH ROW EXECUTE FUNCTION public.calcular_importe_linea();


--
-- Name: clientes auth_clientes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_clientes ON public.clientes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: lineas_reparacion auth_lineas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_lineas ON public.lineas_reparacion TO authenticated USING (true) WITH CHECK (true);


--
-- Name: reparaciones auth_reparaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_reparaciones ON public.reparaciones TO authenticated USING (true) WITH CHECK (true);


--
-- Name: vehiculos auth_vehiculos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_vehiculos ON public.vehiculos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: lineas_reparacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lineas_reparacion ENABLE ROW LEVEL SECURITY;

--
-- Name: reparaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reparaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: vehiculos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict hKHOva3NOCMG5ijtcHJF4GLi9c6PQwdXi6m0YeK8500xqtVlfF216U5N1xTgnuN

