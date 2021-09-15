/*
 * SonarQube
 * Copyright (C) 2009-2021 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { shallow } from 'enzyme';
import * as React from 'react';
import RadioToggle from '../../../../../components/controls/RadioToggle';
import {
  mockBitbucketCloudBindingDefinition,
  mockBitbucketServerBindingDefinition
} from '../../../../../helpers/mocks/alm-settings';
import { AlmKeys } from '../../../../../types/alm-settings';
import BitbucketForm, { BitbucketFormProps } from '../BitbucketForm';

it('should render correctly', () => {
  let wrapper = shallowRender({
    variant: AlmKeys.BitbucketServer,
    formData: mockBitbucketServerBindingDefinition()
  });
  expect(wrapper).toMatchSnapshot('bbs');

  wrapper = shallowRender({
    variant: AlmKeys.BitbucketCloud,
    formData: mockBitbucketCloudBindingDefinition()
  });
  expect(wrapper).toMatchSnapshot('bbc');

  wrapper = shallowRender({
    isUpdate: true,
    variant: AlmKeys.BitbucketServer,
    formData: mockBitbucketServerBindingDefinition()
  });
  expect(wrapper).toMatchSnapshot('update bbs');

  wrapper = shallowRender({
    isUpdate: true,
    variant: AlmKeys.BitbucketCloud,
    formData: mockBitbucketCloudBindingDefinition()
  });
  expect(wrapper).toMatchSnapshot('update bbc');
});

it('should render propagete variant properly', () => {
  const onVariantChange = jest.fn();
  const wrapper = shallowRender({ onVariantChange });

  wrapper
    .find(RadioToggle)
    .props()
    .onCheck(AlmKeys.BitbucketServer);

  expect(onVariantChange).toHaveBeenCalledWith(AlmKeys.BitbucketServer);
});

function shallowRender(props: Partial<BitbucketFormProps> = {}) {
  return shallow(
    <BitbucketForm
      formData={mockBitbucketServerBindingDefinition()}
      isUpdate={false}
      onFieldChange={jest.fn()}
      variant={AlmKeys.BitbucketServer}
      onVariantChange={jest.fn()}
      {...props}
    />
  );
}
