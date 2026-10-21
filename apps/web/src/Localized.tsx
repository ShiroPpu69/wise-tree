import {Children,cloneElement,isValidElement,type ReactNode} from 'react';
import {translate} from '../../../packages/i18n-core/index.ts';
// Only application labels/attributes are localized. User/model text and editable configuration stay verbatim.
export function localize(node:ReactNode):ReactNode{
 if(typeof node==='string')return translate(node);
 if(!isValidElement<Record<string,unknown>>(node))return Array.isArray(node)?Children.map(node,localize):node;
 if(node.props['data-raw'])return node;
 const props:Record<string,unknown>={};
 for(const key of ['aria-label','placeholder','title'])if(typeof node.props[key]==='string')props[key]=translate(node.props[key]);
 if(node.props.children!==undefined)props.children=Children.map(node.props.children as ReactNode,localize);
 return cloneElement(node,props);
}
