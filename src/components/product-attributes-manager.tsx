"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export interface ProductAttribute {
  id?: string;
  attributeName: string;
  attributeValue: string;
  attributeGroup?: string;
  displayOrder: number;
  isVariant: boolean;
  priceModifier?: number;
  stockModifier?: number;
}

interface ProductAttributesManagerProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

const ATTRIBUTE_GROUPS = [
  { value: 'specification', label: 'Specification' },
  { value: 'feature', label: 'Feature' },
  { value: 'variant', label: 'Variant' },
];

export default function ProductAttributesManager({
  attributes,
  onChange,
}: ProductAttributesManagerProps) {
  const [newAttribute, setNewAttribute] = useState<Partial<ProductAttribute>>({
    attributeName: '',
    attributeValue: '',
    attributeGroup: 'specification',
    isVariant: false,
    priceModifier: 0,
    stockModifier: 0,
  });

  const handleAddAttribute = () => {
    if (!newAttribute.attributeName || !newAttribute.attributeValue) {
      return;
    }

    const attribute: ProductAttribute = {
      attributeName: newAttribute.attributeName,
      attributeValue: newAttribute.attributeValue,
      attributeGroup: newAttribute.attributeGroup || 'specification',
      displayOrder: attributes.length,
      isVariant: newAttribute.isVariant || false,
      priceModifier: newAttribute.priceModifier || 0,
      stockModifier: newAttribute.stockModifier || 0,
    };

    onChange([...attributes, attribute]);

    // Reset form
    setNewAttribute({
      attributeName: '',
      attributeValue: '',
      attributeGroup: 'specification',
      isVariant: false,
      priceModifier: 0,
      stockModifier: 0,
    });
  };

  const handleRemoveAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const groupedAttributes = attributes.reduce((acc, attr) => {
    const group = attr.attributeGroup || 'specification';
    if (!acc[group]) acc[group] = [];
    acc[group].push(attr);
    return acc;
  }, {} as Record<string, ProductAttribute[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Product Attributes & Features
        </CardTitle>
        <CardDescription>
          Add specifications, features, and variant options for this product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Attribute Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-sm">Add New Attribute</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attr-name">Attribute Name</Label>
              <Input
                id="attr-name"
                placeholder="e.g., Color, Size, Material"
                value={newAttribute.attributeName}
                onChange={(e) => setNewAttribute({ ...newAttribute, attributeName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attr-value">Value</Label>
              <Input
                id="attr-value"
                placeholder="e.g., Red, XL, Cotton"
                value={newAttribute.attributeValue}
                onChange={(e) => setNewAttribute({ ...newAttribute, attributeValue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attr-group">Group</Label>
              <Select
                value={newAttribute.attributeGroup}
                onValueChange={(value) => setNewAttribute({ ...newAttribute, attributeGroup: value })}
              >
                <SelectTrigger id="attr-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_GROUPS.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-mod">Price Modifier (GMD)</Label>
              <Input
                id="price-mod"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAttribute.priceModifier}
                onChange={(e) => setNewAttribute({ ...newAttribute, priceModifier: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-variant"
                  checked={newAttribute.isVariant}
                  onCheckedChange={(checked) => setNewAttribute({ ...newAttribute, isVariant: checked as boolean })}
                />
                <Label htmlFor="is-variant" className="text-sm font-normal">
                  Affects variants
                </Label>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddAttribute}
            size="sm"
            disabled={!newAttribute.attributeName || !newAttribute.attributeValue}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Attribute
          </Button>
        </div>

        {/* Display Grouped Attributes */}
        {Object.keys(groupedAttributes).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedAttributes).map(([group, attrs]) => (
              <div key={group} className="space-y-2">
                <h4 className="font-semibold text-sm capitalize">{group}s</h4>
                <div className="space-y-2">
                  {attrs.map((attr, index) => {
                    const globalIndex = attributes.indexOf(attr);
                    return (
                      <div key={globalIndex} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="font-medium">{attr.attributeName}:</span> {attr.attributeValue}
                          </div>
                          {attr.priceModifier !== 0 && (
                            <div className="text-muted-foreground">
                              Price: {attr.priceModifier > 0 ? '+' : ''}{attr.priceModifier} GMD
                            </div>
                          )}
                          {attr.isVariant && (
                            <div className="text-xs text-primary">
                              Variant Option
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAttribute(globalIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No attributes added yet. Add specifications, features, or variant options above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
