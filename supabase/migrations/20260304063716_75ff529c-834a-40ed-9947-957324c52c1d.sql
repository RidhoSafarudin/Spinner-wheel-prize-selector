
-- Create prizes table
CREATE TABLE public.prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image_url TEXT,
  color TEXT DEFAULT '#FFD700',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spin history table
CREATE TABLE public.spin_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_id UUID NOT NULL REFERENCES public.prizes(id),
  prize_name TEXT NOT NULL,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;

-- Prizes: everyone can read active prizes
CREATE POLICY "Anyone can view active prizes"
  ON public.prizes FOR SELECT
  USING (true);

-- Prizes: only authenticated users (admins) can insert/update/delete
CREATE POLICY "Authenticated users can insert prizes"
  ON public.prizes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update prizes"
  ON public.prizes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete prizes"
  ON public.prizes FOR DELETE
  TO authenticated
  USING (true);

-- Spin history: anyone can insert (public spins)
CREATE POLICY "Anyone can insert spin history"
  ON public.spin_history FOR INSERT
  WITH CHECK (true);

-- Spin history: anyone can view spin history
CREATE POLICY "Anyone can view spin history"
  ON public.spin_history FOR SELECT
  USING (true);

-- Function to atomically spin and win a prize
CREATE OR REPLACE FUNCTION public.spin_prize(prize_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prize_record RECORD;
  result JSON;
BEGIN
  -- Lock and check the prize
  SELECT id, name, quantity, status INTO prize_record
  FROM public.prizes
  WHERE id = prize_id_param
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Prize not found');
  END IF;

  IF prize_record.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Prize is not active');
  END IF;

  IF prize_record.quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Prize is out of stock');
  END IF;

  -- Decrement quantity
  UPDATE public.prizes
  SET quantity = quantity - 1,
      status = CASE WHEN quantity - 1 = 0 THEN 'inactive' ELSE status END,
      updated_at = now()
  WHERE id = prize_id_param;

  -- Record spin history
  INSERT INTO public.spin_history (prize_id, prize_name)
  VALUES (prize_id_param, prize_record.name);

  RETURN json_build_object(
    'success', true,
    'prize_name', prize_record.name,
    'remaining', prize_record.quantity - 1
  );
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_prizes_updated_at
  BEFORE UPDATE ON public.prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
